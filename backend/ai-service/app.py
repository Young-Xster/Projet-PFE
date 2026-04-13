from flask import Flask, request, jsonify, render_template_string
from candidateMatcher import CandidateMatcher
from EmployeePerformanceRater import EmployeePerformanceRater
from pypdf import PdfReader
from uuid import UUID, uuid4
import io

app = Flask(__name__)




# @app.route("/test", methods=["GET"])
# def test_page():
#     return render_template_string(TEST_PAGE)


@app.route("/test/match", methods=["POST"])
def test_match():
    import json
    job_description = (
        request.form.get("jobTitle", "") + "\n"
        + request.form.get("jobDesc", "") + "\n"
        + request.form.get("jobReqs", "")
    )
    candidates_meta = json.loads(request.form.get("candidatesMeta", "[]"))
    results = []

    for i, meta in enumerate(candidates_meta):
        cv_content = ""
        cv_file = request.files.get(f"cv_{i}")
        if cv_file:
            try:
                reader = PdfReader(io.BytesIO(cv_file.read()))
                cv_content = "\n".join(
                    page.extract_text() for page in reader.pages
                    if page.extract_text()
                )
            except Exception as e:
                cv_content = f"[Could not read PDF: {e}]"

        matcher = CandidateMatcher(
            candidateId=uuid4(),
            firstName=meta.get("firstName", ""),
            lastName=meta.get("lastName", ""),
            skills=meta.get("skills", ""),
            experienceYears=meta.get("experienceYears", 0),
            educationLevel=meta.get("educationLevel", ""),
            cvBase64="",
            cvContent=cv_content,
            cvFilePath="",
        )
        matcher.compute_score(job_description)

        results.append({
            "candidateId": str(matcher.candidateId),
            "candidateName": f"{matcher.firstName} {matcher.lastName}",
            "score": matcher.score,
            "reasoning": matcher.reasoning,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return jsonify({"results": results})


@app.route("/api/v1/match", methods=["POST"])
def match_candidates():
    data = request.get_json()

    job_description = (
        (data.get("jobTitle") or "") + "\n"
        + (data.get("jobDescription") or "") + "\n"
        + (data.get("requirements") or "")
    )
    candidates_data = data.get("candidates", [])

    results = []

    for c in candidates_data:
        matcher = CandidateMatcher(
            candidateId=UUID(str(c["candidateId"])),
            firstName=c.get("firstName", ""),
            lastName=c.get("lastName", ""),
            skills=c.get("skills", ""),
            experienceYears=c.get("experienceYears", 0),
            educationLevel=c.get("educationLevel", ""),
            cvBase64=c.get("cvBase64", ""),
            cvContent=c.get("cvContent", ""),
            cvFilePath=c.get("cvFilePath", ""),
        )

        matcher.get_cv_content()
        matcher.compute_score(job_description)

        results.append({
            "candidateId": str(matcher.candidateId),
            "candidateName": f"{matcher.firstName} {matcher.lastName}",
            "score": matcher.score,
            "reasoning": matcher.reasoning,
        })

    results.sort(key=lambda x: x["score"], reverse=True)

    return jsonify({
        "jobListingId": data.get("jobListingId"),
        "results": results,
    })


@app.route("/api/v1/performance/rate", methods=["POST"])
def rate_performance():
    data = request.get_json(silent=True) or {}
    metrics_list = data.get("metrics", [])

    if not metrics_list:
        return jsonify({"results": []})

    # Build a SINGLE batch prompt for ALL employees
    employees_data = ""
    for i, m in enumerate(metrics_list, 1):
        employees_data += (
            f"Employee {i}: {m.get('firstName', '')} {m.get('lastName', '')}\n"
            f"  Job: {m.get('jobTitle', '')} | Department: {m.get('department', 'N/A')}\n"
            f"  Working Days: {m.get('totalWorkingDays', 0)} | Present: {m.get('presentDays', 0)}\n"
            f"  Late: {m.get('lateArrivalsCount', 0)} times ({m.get('totalLateMinutes', 0)} min)\n"
            f"  Absences: {m.get('absencesCount', 0)} days\n"
            f"  Early Departures: {m.get('earlyDeparturesCount', 0)} times ({m.get('totalEarlyDepartureMinutes', 0)} min)\n"
            f"  Overtime: {m.get('overtimeMinutes', 0)} min\n"
            f"  Sick Leave: {m.get('sickLeaveDays', 0)} days | Total Leave: {m.get('totalLeaveDays', 0)} days\n\n"
        )

    system_prompt = (
        "You are an HR performance evaluator. Rate each employee from 1-100 (float, 2 decimals) "
        "based on their attendance metrics. Higher is better. Consider: punctuality, absences, "
        "early departures, overtime, and sick leave. "
        "Respond ONLY with a JSON array in this exact format:\n"
        '[{"index": 1, "score": 85.50, "reasoning": "short reason"}, {"index": 2, "score": 72.30, "reasoning": "..."}]'
    )

    user_prompt = f"Evaluate these {len(metrics_list)} employees:\n\n{employees_data}\nReturn JSON array only."

    results = []

    try:
        from g4f import Client
        client = Client()
        response = client.chat.completions.create(
            model="moonshotai/kimi-k2-instruct",
            provider="Groq",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        content = response.choices[0].message.content.strip()

        # Parse the JSON response
        import json, re
        # Try to extract JSON from the response (might have markdown code blocks)
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            ai_ratings = json.loads(json_match.group())
            
            for rating in ai_ratings:
                idx = rating.get("index", 0) - 1  # 0-based index
                if 0 <= idx < len(metrics_list):
                    m = metrics_list[idx]
                    results.append({
                        "employeeId": str(m.get("employeeId", "")),
                        "firstName": m.get("firstName", ""),
                        "lastName": m.get("lastName", ""),
                        "score": round(float(rating.get("score", 50.0)), 2),
                        "reasoning": rating.get("reasoning", "AI rating computed")
                    })
        
        # Add any employees that weren't rated by AI (fallback)
        rated_indices = {r.get("employeeId") for r in results}
        for m in metrics_list:
            emp_id = str(m.get("employeeId", ""))
            if emp_id not in rated_indices:
                late = int(m.get("lateArrivalsCount", 0) or 0)
                late_min = int(m.get("totalLateMinutes", 0) or 0)
                absences = int(m.get("absencesCount", 0) or 0)
                early_dep = int(m.get("earlyDeparturesCount", 0) or 0)
                overtime = int(m.get("overtimeMinutes", 0) or 0)
                sick = int(m.get("sickLeaveDays", 0) or 0)

                score = 100.0 - (late * 2.5) - (late_min / 60.0 * 1.5) - (absences * 10.0) - (early_dep * 2.0) - (sick * 1.5) + min(8.0, overtime / 60.0)
                score = max(1.0, min(100.0, score))
                
                results.append({
                    "employeeId": emp_id,
                    "firstName": m.get("firstName", ""),
                    "lastName": m.get("lastName", ""),
                    "score": round(score, 2),
                    "reasoning": "Fallback score used (AI did not rate this employee)."
                })
    except Exception as ex:
        print(f"AI rating failed: {str(ex)}, using fallback scoring")
        # Fallback: compute scores for ALL employees
        for m in metrics_list:
            late = int(m.get("lateArrivalsCount", 0) or 0)
            late_min = int(m.get("totalLateMinutes", 0) or 0)
            absences = int(m.get("absencesCount", 0) or 0)
            early_dep = int(m.get("earlyDeparturesCount", 0) or 0)
            early_dep_min = int(m.get("totalEarlyDepartureMinutes", 0) or 0)
            overtime = int(m.get("overtimeMinutes", 0) or 0)
            sick = int(m.get("sickLeaveDays", 0) or 0)

            score = 100.0 - (late * 2.5) - (late_min / 60.0 * 1.5) - (absences * 10.0) - (early_dep * 2.0) - (sick * 1.5) + min(8.0, overtime / 60.0)
            score = max(1.0, min(100.0, score))
            
            results.append({
                "employeeId": str(m.get("employeeId", "")),
                "firstName": m.get("firstName", ""),
                "lastName": m.get("lastName", ""),
                "score": round(score, 2),
                "reasoning": "Fallback score used (AI unavailable)."
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return jsonify({"results": results})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8082, debug=False)
