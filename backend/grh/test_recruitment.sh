#!/bin/bash
set -e

BASE="http://localhost:8081/api/v1"
KC="http://localhost:8080/realms/work/protocol/openid-connect/token"
PASS=0
FAIL=0
TOTAL=0

check() {
  TOTAL=$((TOTAL+1))
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $label"
    PASS=$((PASS+1))
  else
    echo "  ❌ $label (expected=$expected, got=$actual)"
    FAIL=$((FAIL+1))
  fi
}

# ─── Get token ──────────────────────────────────────────────────────────────
echo "=== Getting superadmin token ==="
TOKEN=$(curl -sf -X POST "$KC" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=GRH&username=superadmin&password=adminkamel" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "  Token obtained (${#TOKEN} chars)"

AUTH="Authorization: Bearer $TOKEN"
COMPANY_ID="02f7d0ac-35a3-464f-86e5-d81229601bf9"

# ─── 1. Create Job Listing ──────────────────────────────────────────────────
echo ""
echo "=== 1. Create Job Listing ==="
LISTING_RESP=$(curl -sf -X POST "$BASE/job-listings" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Java Developer",
    "description": "We are looking for an experienced Java developer.",
    "requirements": "5+ years Java, Spring Boot, PostgreSQL",
    "employmentType": "full-time",
    "salaryMin": 50000,
    "salaryMax": 80000,
    "numberOfPositions": 2,
    "deadline": "2026-12-31",
    "companyId": "'$COMPANY_ID'"
  }')

LISTING_ID=$(echo "$LISTING_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "FAILED")
LISTING_STATUS=$(echo "$LISTING_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null || echo "FAILED")
check "Job listing created" "open" "$LISTING_STATUS"
echo "  Listing ID: $LISTING_ID"

# ─── 2. Get Public Listings ─────────────────────────────────────────────────
echo ""
echo "=== 2. Get Public Listings (no auth) ==="
PUBLIC_CODE=$(curl -s -o /tmp/pub_resp.json -w "%{http_code}" "$BASE/job-listings/public")
check "Public listings endpoint" "200" "$PUBLIC_CODE"
PUB_COUNT=$(python3 -c "import json; d=json.load(open('/tmp/pub_resp.json')); print(len(d['data']))" 2>/dev/null || echo "0")
echo "  Found $PUB_COUNT public listings"

# ─── 3. Get Public Listing by ID ────────────────────────────────────────────
echo ""
echo "=== 3. Get Public Listing by ID (no auth) ==="
PUB_DETAIL_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/job-listings/public/$LISTING_ID")
check "Public listing detail" "200" "$PUB_DETAIL_CODE"

# ─── 4. Filter Public by Company =───────────────────────────────────────────
echo ""
echo "=== 4. Filter Public Listings by Company ==="
PUB_FILTER_CODE=$(curl -s -o /tmp/pub_filter.json -w "%{http_code}" "$BASE/job-listings/public?companyId=$COMPANY_ID")
check "Filter by company" "200" "$PUB_FILTER_CODE"

# ─── 5. Get My Company Listings ─────────────────────────────────────────────
echo ""
echo "=== 5. Get My Company Listings (auth) ==="
MY_CODE=$(curl -s -o /tmp/my_listings.json -w "%{http_code}" "$BASE/job-listings/my-company" -H "$AUTH")
check "My company listings" "200" "$MY_CODE"

# ─── 6. Candidate Applies (public, multipart) ───────────────────────────────
echo ""
echo "=== 6. Candidate Applies (public, no auth) ==="
APPLY_RESP=$(curl -sf -X POST "$BASE/candidates/public/apply" \
  -F "jobListingId=$LISTING_ID" \
  -F "firstName=Alice" \
  -F "lastName=Wonderland" \
  -F "email=alice.candidate.test@example.com" \
  -F "phone=+213555123456" \
  -F "city=Algiers" \
  -F "educationLevel=university" \
  -F "experienceYears=3" \
  -F "skills=Java, Spring Boot" \
  -F "languagesSpoken=French, English, Arabic")

CANDIDATE_ID=$(echo "$APPLY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "FAILED")
CAND_STATUS=$(echo "$APPLY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null || echo "FAILED")
check "Candidate applied" "stage_1" "$CAND_STATUS"
echo "  Candidate ID: $CANDIDATE_ID"

# ─── 7. Duplicate Application ───────────────────────────────────────────────
echo ""
echo "=== 7. Duplicate Application (same email + listing) ==="
DUP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/candidates/public/apply" \
  -F "jobListingId=$LISTING_ID" \
  -F "firstName=Alice" \
  -F "lastName=Wonderland" \
  -F "email=alice.candidate.test@example.com")
check "Duplicate rejected" "409" "$DUP_CODE"

# ─── 8. HR: View Candidates by Listing ──────────────────────────────────────
echo ""
echo "=== 8. HR: View Candidates by Listing ==="
CANDS_CODE=$(curl -s -o /tmp/cands.json -w "%{http_code}" "$BASE/candidates/job-listing/$LISTING_ID" -H "$AUTH")
check "Candidates by listing" "200" "$CANDS_CODE"
CAND_COUNT=$(python3 -c "import json; d=json.load(open('/tmp/cands.json')); print(len(d['data']))" 2>/dev/null || echo "0")
echo "  Found $CAND_COUNT candidates"

# ─── 9. HR: View Candidates by Stage ────────────────────────────────────────
echo ""
echo "=== 9. HR: View Candidates by Stage (stage 1) ==="
STAGE_CODE=$(curl -s -o /tmp/stage.json -w "%{http_code}" "$BASE/candidates/job-listing/$LISTING_ID/stage/1" -H "$AUTH")
check "Candidates by stage" "200" "$STAGE_CODE"

# ─── 10. HR: View Candidates by Status ──────────────────────────────────────
echo ""
echo "=== 10. HR: View Candidates by Status (stage_1) ==="
STATUS_CODE=$(curl -s -o /tmp/status.json -w "%{http_code}" "$BASE/candidates/job-listing/$LISTING_ID/status/stage_1" -H "$AUTH")
check "Candidates by status" "200" "$STATUS_CODE"

# ─── 11. HR: Get Candidate by ID ────────────────────────────────────────────
echo ""
echo "=== 11. HR: Get Candidate by ID ==="
CAND_GET_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/candidates/$CANDIDATE_ID" -H "$AUTH")
check "Get candidate by ID" "200" "$CAND_GET_CODE"

# ─── 12. HR: Add Notes ──────────────────────────────────────────────────────
echo ""
echo "=== 12. HR: Add Notes to Candidate ==="
NOTES_CODE=$(curl -s -o /tmp/notes.json -w "%{http_code}" -X POST "$BASE/candidates/$CANDIDATE_ID/notes" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Strong Java background. Schedule interview."}')
check "Add notes" "200" "$NOTES_CODE"

# ─── 13. HR: Advance Candidate (stage 1 → 2) ────────────────────────────────
echo ""
echo "=== 13. HR: Advance Candidate (1 → 2) ==="
ADV_RESP=$(curl -sf -X POST "$BASE/candidates/$CANDIDATE_ID/advance" -H "$AUTH")
ADV_STAGE=$(echo "$ADV_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['currentStage'])" 2>/dev/null || echo "FAILED")
ADV_STATUS=$(echo "$ADV_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null || echo "FAILED")
check "Advanced to stage 2" "2" "$ADV_STAGE"
check "Status is stage_2" "stage_2" "$ADV_STATUS"

# ─── 14. HR: Advance Beyond Stage 2 (should fail) ───────────────────────────
echo ""
echo "=== 14. HR: Advance Beyond Stage 2 (should fail) ==="
ADV2_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/candidates/$CANDIDATE_ID/advance" -H "$AUTH")
check "Cannot advance past stage 2" "409" "$ADV2_CODE"

# ─── 15. HR: Accept Candidate ───────────────────────────────────────────────
echo ""
echo "=== 15. HR: Accept Candidate ==="
ACC_RESP=$(curl -sf -X POST "$BASE/candidates/$CANDIDATE_ID/accept" -H "$AUTH")
ACC_STATUS=$(echo "$ACC_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null || echo "FAILED")
check "Candidate accepted" "accepted" "$ACC_STATUS"

# ─── 16. Apply another candidate then reject ────────────────────────────────
echo ""
echo "=== 16. Apply Second Candidate ==="
APPLY2_RESP=$(curl -sf -X POST "$BASE/candidates/public/apply" \
  -F "jobListingId=$LISTING_ID" \
  -F "firstName=Bob" \
  -F "lastName=Builder" \
  -F "email=bob.candidate.test@example.com" \
  -F "phone=+213555654321" \
  -F "city=Oran" \
  -F "experienceYears=1")

CANDIDATE2_ID=$(echo "$APPLY2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "FAILED")
check "Second candidate applied" "true" "$([ "$CANDIDATE2_ID" != "FAILED" ] && echo true || echo false)"

echo ""
echo "=== 17. HR: Reject Second Candidate ==="
REJ_RESP=$(curl -sf -X POST "$BASE/candidates/$CANDIDATE2_ID/reject" -H "$AUTH")
REJ_STATUS=$(echo "$REJ_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null || echo "FAILED")
REJ_STAGE=$(echo "$REJ_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['rejectedAtStage'])" 2>/dev/null || echo "FAILED")
check "Candidate rejected" "rejected" "$REJ_STATUS"
check "Rejected at stage 1" "1" "$REJ_STAGE"

# ─── 18. HR: Update Job Listing ─────────────────────────────────────────────
echo ""
echo "=== 18. HR: Update Job Listing ==="
UPD_CODE=$(curl -s -o /tmp/upd.json -w "%{http_code}" -X PUT "$BASE/job-listings/$LISTING_ID" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"title": "Senior Java Developer (Updated)", "numberOfPositions": 3, "companyId": "'$COMPANY_ID'"}')
check "Update listing" "200" "$UPD_CODE"
UPD_TITLE=$(python3 -c "import json; d=json.load(open('/tmp/upd.json')); print(d['data']['title'])" 2>/dev/null || echo "FAILED")
check "Title updated" "Senior Java Developer (Updated)" "$UPD_TITLE"

# ─── 19. HR: Close Listing Manually ─────────────────────────────────────────
echo ""
echo "=== 19. HR: Close Listing ==="
CLOSE_RESP=$(curl -sf -X POST "$BASE/job-listings/$LISTING_ID/close" -H "$AUTH")
CLOSE_STATUS=$(echo "$CLOSE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null || echo "FAILED")
check "Listing closed" "closed" "$CLOSE_STATUS"

# ─── 20. Apply to Closed Listing (should fail) ──────────────────────────────
echo ""
echo "=== 20. Apply to Closed Listing (should fail) ==="
CLOSED_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/candidates/public/apply" \
  -F "jobListingId=$LISTING_ID" \
  -F "firstName=Charlie" \
  -F "lastName=Brown" \
  -F "email=charlie@example.com")
check "Cannot apply to closed listing" "409" "$CLOSED_CODE"

# ─── 21. Delete Listing ─────────────────────────────────────────────────────
echo ""
echo "=== 21. HR: Delete Listing ==="
DEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/job-listings/$LISTING_ID" -H "$AUTH")
check "Delete listing" "200" "$DEL_CODE"

# ─── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo "  RESULTS: $PASS/$TOTAL passed, $FAIL failed"
echo "════════════════════════════════════════════"
