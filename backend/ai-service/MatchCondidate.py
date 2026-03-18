from flask import Flask , request , jsonify
from candidateMatcher import CandidateMatcher
from uuid import UUID

app = Flask(__name__)

@app.route("/api/v1/match" , methods=["POST"])
def match_candidate():
    data = request.get_json()

    job_description = (data.get("jobDescription") or "") + "\n" + (data.get("requirements") or "")
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
            cvFilePath=c.get("cvFilePath", "")
        )

        matcher.get_cv_content()
        matcher.compute_score(job_description)

        results.append({
            "candidateId": str(matcher.candidateId),
            "candidateName": f"{matcher.firstName} {matcher.lastName}",
            "score": matcher.score,
            "reasoning": matcher.reasoning
        })
    
    results.sort(key=lambda x: x["score"], reverse=True)

    return jsonify({
        "jobListingId": data.get("jobListingId"),
        "results": results
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8082, debug=False)