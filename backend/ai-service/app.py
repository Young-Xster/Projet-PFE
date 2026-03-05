from flask import Flask, request, jsonify, render_template_string
from candidateMatcher import CandidateMatcher
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8082, debug=False)
