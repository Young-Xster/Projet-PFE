#!/bin/bash
set +e

BASE="http://localhost:8081/api/v1"
KC="http://localhost:8080/realms/work/protocol/openid-connect/token"
COMPANY_ID="02f7d0ac-35a3-464f-86e5-d81229601bf9"
SUPERADMIN_ID="f0e5a370-c207-40ba-81e1-414eeb9fb5df"

PASS=0
FAIL=0

check() {
    local name="$1" expected="$2" actual="$3"
    if echo "$actual" | grep -q "$expected"; then
        echo "  ✅ $name"
        PASS=$((PASS+1))
    else
        echo "  ❌ $name (expected '$expected')"
        echo "     GOT: $(echo "$actual" | head -3)"
        FAIL=$((FAIL+1))
    fi
}

echo "=== Getting token ==="
TOKEN=$(curl -s -X POST "$KC" -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=GRH&username=superadmin&password=adminkamel" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token: OK (${#TOKEN} chars)"

# Get an employee
EMPLOYEE_ID=$(curl -s "$BASE/employees/company/$COMPANY_ID" -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',d); print(items[0]['employeeId'] if isinstance(items,list) and len(items)>0 else '')")
echo "Employee: $EMPLOYEE_ID"

echo ""
echo "========================================="
echo "  PERFORMANCE REVIEW TESTS"
echo "========================================="

# 1. Create review (pending)
echo ""
echo "--- Step 1: Create review ---"
R1=$(curl -s -X POST "$BASE/performance-reviews" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"companyId\":\"$COMPANY_ID\",\"employeeId\":\"$EMPLOYEE_ID\",\"reviewerId\":\"$SUPERADMIN_ID\",\"reviewPeriodStart\":\"2026-01-01\",\"reviewPeriodEnd\":\"2026-03-31\"}")
REVIEW_ID=$(echo "$R1" | python3 -c "import sys,json; d=json.load(sys.stdin).get('data'); print(d.get('id','') if d else '')" 2>/dev/null)
check "Create review" '"status":"pending"' "$R1"
echo "  Review ID: $REVIEW_ID"

# 2. Duplicate period (should fail)
echo ""
echo "--- Step 2: Reject overlapping period ---"
R2=$(curl -s -X POST "$BASE/performance-reviews" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"companyId\":\"$COMPANY_ID\",\"employeeId\":\"$EMPLOYEE_ID\",\"reviewerId\":\"$SUPERADMIN_ID\",\"reviewPeriodStart\":\"2026-02-01\",\"reviewPeriodEnd\":\"2026-04-30\"}")
check "Reject overlapping" "overlapping" "$R2"

# 3. Update with details (still pending)
echo ""
echo "--- Step 3: Fill in details ---"
R3=$(curl -s -X PUT "$BASE/performance-reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"overallRating":4,"strengths":"Excellent communication","areasForImprovement":"Time management","goals":"Lead a project by Q4"}')
check "Update details" '"overallRating":4' "$R3"
check "Strengths set" '"strengths":"Excellent communication"' "$R3"

# 4. Get by ID
echo ""
echo "--- Step 4: Get review by ID ---"
R4=$(curl -s "$BASE/performance-reviews/$REVIEW_ID" -H "Authorization: Bearer $TOKEN")
check "Get by ID" '"overallRating":4' "$R4"
check "Still pending" '"status":"pending"' "$R4"

# 5. Mark as reviewed
echo ""
echo "--- Step 5: Mark as reviewed ---"
R5=$(curl -s -X PUT "$BASE/performance-reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"reviewed"}')
check "Status reviewed" '"status":"reviewed"' "$R5"
check "ReviewedAt set" '"reviewedAt"' "$R5"

# 6. Try review without rating (new review)
echo ""
echo "--- Step 6: Cannot mark reviewed without rating ---"
R6_CREATE=$(curl -s -X POST "$BASE/performance-reviews" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"companyId\":\"$COMPANY_ID\",\"employeeId\":\"$EMPLOYEE_ID\",\"reviewerId\":\"$SUPERADMIN_ID\",\"reviewPeriodStart\":\"2025-01-01\",\"reviewPeriodEnd\":\"2025-03-31\"}")
R6_ID=$(echo "$R6_CREATE" | python3 -c "import sys,json; d=json.load(sys.stdin).get('data'); print(d.get('id','') if d else '')" 2>/dev/null)
R6=$(curl -s -X PUT "$BASE/performance-reviews/$R6_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"reviewed"}')
check "Reject review without rating" "without an overall rating" "$R6"

# 7. Acknowledge
echo ""
echo "--- Step 7: Acknowledge review ---"
R7=$(curl -s -X POST "$BASE/performance-reviews/$REVIEW_ID/acknowledge?acknowledgedByUserId=$SUPERADMIN_ID" \
  -H "Authorization: Bearer $TOKEN")
check "Acknowledged" '"status":"acknowledged"' "$R7"
check "AcknowledgedBy set" '"acknowledgedByName":"superadmin"' "$R7"

# 8. Cannot update acknowledged
echo ""
echo "--- Step 8: Cannot update acknowledged ---"
R8=$(curl -s -X PUT "$BASE/performance-reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"overallRating":5}')
check "Reject update acknowledged" "acknowledged" "$R8"

# 9. Cannot delete acknowledged
echo ""
echo "--- Step 9: Cannot delete acknowledged ---"
R9=$(curl -s -X DELETE "$BASE/performance-reviews/$REVIEW_ID" -H "Authorization: Bearer $TOKEN")
check "Reject delete acknowledged" "acknowledged" "$R9"

# 10. List by company
echo ""
echo "--- Step 10: List by company ---"
R10=$(curl -s "$BASE/performance-reviews/company/$COMPANY_ID" -H "Authorization: Bearer $TOKEN")
COUNT=$(echo "$R10" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))")
check "List company reviews" "2" "$COUNT"

# 11. Filter by status
echo ""
echo "--- Step 11: Filter by status ---"
R11=$(curl -s "$BASE/performance-reviews/company/$COMPANY_ID/status/acknowledged" -H "Authorization: Bearer $TOKEN")
ACK_COUNT=$(echo "$R11" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))")
check "Acknowledged count" "1" "$ACK_COUNT"

# 12. Get by employee
echo ""
echo "--- Step 12: Get by employee ---"
R12=$(curl -s "$BASE/performance-reviews/employee/$EMPLOYEE_ID" -H "Authorization: Bearer $TOKEN")
EMP_COUNT=$(echo "$R12" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))")
check "Employee reviews count" "2" "$EMP_COUNT"

# 13. Delete pending review
echo ""
echo "--- Step 13: Delete pending review ---"
R13=$(curl -s -X DELETE "$BASE/performance-reviews/$R6_ID" -H "Authorization: Bearer $TOKEN")
check "Delete pending OK" "deleted" "$R13"

echo ""
echo "========================================="
echo "  ATTENDANCE TESTS"
echo "========================================="

# 1. Create attendance
echo ""
echo "--- Step 1: Create attendance ---"
A1=$(curl -s -X POST "$BASE/attendance" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"companyId\":\"$COMPANY_ID\",\"employeeId\":\"$EMPLOYEE_ID\",\"date\":\"2026-02-23\",\"clockInTime\":\"2026-02-23T08:00:00+01:00\",\"clockOutTime\":\"2026-02-23T17:00:00+01:00\",\"status\":\"present\",\"notes\":\"Normal work day\"}")
ATT_ID=$(echo "$A1" | python3 -c "import sys,json; d=json.load(sys.stdin).get('data'); print(d.get('id','') if d else '')" 2>/dev/null)
check "Create attendance" '"status":"present"' "$A1"
check "Clock in set" '"clockInTime"' "$A1"
check "Work duration calc'd" '"workDurationMinutes":540' "$A1"
echo "  Attendance ID: $ATT_ID"

# 2. Duplicate same employee+date (should fail)
echo ""
echo "--- Step 2: Reject duplicate ---"
A2=$(curl -s -X POST "$BASE/attendance" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"companyId\":\"$COMPANY_ID\",\"employeeId\":\"$EMPLOYEE_ID\",\"date\":\"2026-02-23\",\"clockInTime\":\"2026-02-23T09:00:00+01:00\"}")
check "Reject duplicate" "already exists" "$A2"

# 3. Update attendance
echo ""
echo "--- Step 3: Update attendance ---"
A3=$(curl -s -X PUT "$BASE/attendance/$ATT_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"clockOutTime":"2026-02-23T18:00:00+01:00","notes":"Overtime"}')
check "Update attendance" '"notes":"Overtime"' "$A3"
check "Work duration recalc" '"workDurationMinutes":600' "$A3"

# 4. Get by ID
echo ""
echo "--- Step 4: Get by ID ---"
A4=$(curl -s "$BASE/attendance/$ATT_ID" -H "Authorization: Bearer $TOKEN")
check "Get attendance" '"notes":"Overtime"' "$A4"

# 5. Get by company+date
echo ""
echo "--- Step 5: Get by company and date ---"
A5=$(curl -s "$BASE/attendance/company/$COMPANY_ID/date/2026-02-23" -H "Authorization: Bearer $TOKEN")
A5_COUNT=$(echo "$A5" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))")
check "Company date records" "1" "$A5_COUNT"

# 6. Get by company+range
echo ""
echo "--- Step 6: Get by company and range ---"
A6=$(curl -s "$BASE/attendance/company/$COMPANY_ID/range?startDate=2026-02-01&endDate=2026-02-28" -H "Authorization: Bearer $TOKEN")
A6_COUNT=$(echo "$A6" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))")
check "Company range records" "1" "$A6_COUNT"

# 7. Get by employee+range
echo ""
echo "--- Step 7: Get by employee and range ---"
A7=$(curl -s "$BASE/attendance/employee/$EMPLOYEE_ID/range?startDate=2026-02-01&endDate=2026-02-28" -H "Authorization: Bearer $TOKEN")
A7_COUNT=$(echo "$A7" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))")
check "Employee range records" "1" "$A7_COUNT"

# 8. Delete attendance
echo ""
echo "--- Step 8: Delete attendance ---"
A8=$(curl -s -X DELETE "$BASE/attendance/$ATT_ID" -H "Authorization: Bearer $TOKEN")
check "Delete attendance" "deleted" "$A8"

# 9. Verify deleted
echo ""
echo "--- Step 9: Verify deleted ---"
A9=$(curl -s "$BASE/attendance/$ATT_ID" -H "Authorization: Bearer $TOKEN")
check "Deleted not found" "not found" "$A9"

echo ""
echo "========================================="
echo "  RESULTS"
echo "========================================="
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  Total: $((PASS+FAIL))"
echo "========================================="
