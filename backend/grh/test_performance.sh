#!/bin/bash
set -e

BASE="http://localhost:8081/api/v1"
KC="http://localhost:8080/realms/work/protocol/openid-connect/token"
COMPANY_ID="02f7d0ac-35a3-464f-86e5-d81229601bf9"
SUPERADMIN_ID="f0e5a370-c207-40ba-81e1-414eeb9fb5df"

echo "=== Getting token ==="
TOKEN=$(curl -s -X POST "$KC" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=GRH&username=superadmin&password=adminkamel" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token length: ${#TOKEN}"

echo ""
echo "=== Getting employees ==="
EMPLOYEES=$(curl -s "$BASE/employees/company/$COMPANY_ID" -H "Authorization: Bearer $TOKEN")
echo "$EMPLOYEES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items = d.get('data', d) if isinstance(d, dict) else d
if isinstance(items, list):
    for e in items[:3]:
        print(f\"  employeeId={e.get('employeeId')} name={e.get('firstName')} {e.get('lastName')}\")
else:
    print('Response:', str(d)[:200])
"

EMPLOYEE_ID=$(echo "$EMPLOYEES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items = d.get('data', d) if isinstance(d, dict) else d
if isinstance(items, list) and len(items) > 0:
    print(items[0].get('employeeId',''))
")
echo "Using employeeId: $EMPLOYEE_ID"

echo ""
echo "=== STEP 1: HR creates performance review (status=pending) ==="
CREATE_RESP=$(curl -s -X POST "$BASE/performance-reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"companyId\": \"$COMPANY_ID\",
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"reviewerId\": \"$SUPERADMIN_ID\",
    \"reviewPeriodStart\": \"2026-01-01\",
    \"reviewPeriodEnd\": \"2026-03-31\"
  }")
echo "$CREATE_RESP" | python3 -m json.tool
REVIEW_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))")
echo "Review ID: $REVIEW_ID"

echo ""
echo "=== STEP 2: HR fills in details ==="
curl -s -X PUT "$BASE/performance-reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "overallRating": 4,
    "strengths": "Excellent communication and teamwork",
    "areasForImprovement": "Time management could be improved",
    "goals": "Complete Java certification by Q3 2026"
  }' | python3 -m json.tool

echo ""
echo "=== STEP 3: HR marks as reviewed ==="
curl -s -X PUT "$BASE/performance-reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "reviewed"}' | python3 -m json.tool

echo ""
echo "=== STEP 4: GET review (should show status=reviewed) ==="
curl -s "$BASE/performance-reviews/$REVIEW_ID" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== STEP 5: Acknowledge review ==="
curl -s -X POST "$BASE/performance-reviews/$REVIEW_ID/acknowledge?acknowledgedByUserId=$SUPERADMIN_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== STEP 6: Try to update acknowledged review (should fail) ==="
curl -s -X PUT "$BASE/performance-reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"overallRating": 90}' | python3 -m json.tool

echo ""
echo "=== STEP 7: List all reviews for company ==="
curl -s "$BASE/performance-reviews/company/$COMPANY_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items = d.get('data', [])
print(f'Total reviews: {len(items)}')
for r in items:
    print(f\"  id={r.get('id')[:8]}... status={r.get('status')} employee={r.get('employee',{}).get('fullName')}\")
"

echo ""
echo "=== STEP 8: List reviews by status (acknowledged) ==="
curl -s "$BASE/performance-reviews/company/$COMPANY_ID/status/acknowledged" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items = d.get('data', [])
print(f'Acknowledged reviews: {len(items)}')
"

echo ""
echo "=== STEP 9: Delete acknowledged review (should fail) ==="
curl -s -X DELETE "$BASE/performance-reviews/$REVIEW_ID" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== STEP 10: Create another review and delete it (should succeed) ==="
NEW_REVIEW=$(curl -s -X POST "$BASE/performance-reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"companyId\": \"$COMPANY_ID\",
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"reviewerId\": \"$SUPERADMIN_ID\",
    \"reviewPeriodStart\": \"2026-04-01\",
    \"reviewPeriodEnd\": \"2026-06-30\"
  }")
NEW_ID=$(echo "$NEW_REVIEW" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))")
echo "New review ID: $NEW_ID"
curl -s -X DELETE "$BASE/performance-reviews/$NEW_ID" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== Test complete ==="
