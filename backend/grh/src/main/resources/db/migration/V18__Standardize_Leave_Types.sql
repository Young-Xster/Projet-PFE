DO $$ 
DECLARE
    comp_id UUID;
BEGIN
    FOR comp_id IN SELECT id FROM companies LOOP
        -- Optional: delete old confusing leave types (Careful, might violate FK on leave_requests)
        -- Keep existing or insert new ones:
        INSERT INTO leave_types (company_id, name, code, is_paid, max_days_per_year, description) VALUES
        (comp_id, 'Annual Leave', 'ANNUAL_LEAVE_' || comp_id, true, 25, 'Standard annual leave balance'),
        (comp_id, 'Sick Leave', 'SICK_LEAVE_' || comp_id, true, 15, 'For medical and health reasons'),
        (comp_id, 'Casual Leave', 'CASUAL_LEAVE_' || comp_id, true, 5, 'Short duration casual needs'),
        (comp_id, 'Maternity Leave', 'MATERNITY_LEAVE_' || comp_id, true, 90, 'Maternity leave for mothers'),
        (comp_id, 'Paternity Leave', 'PATERNITY_LEAVE_' || comp_id, true, 14, 'Paternity leave for fathers'),
        (comp_id, 'Parental Leave', 'PARENTAL_LEAVE_' || comp_id, false, 30, 'Unpaid parental leave'),
        (comp_id, 'Bereavement Leave', 'BEREAVEMENT_LEAVE_' || comp_id, true, 3, 'Leave for loss of family member'),
        (comp_id, 'Marriage Leave', 'MARRIAGE_LEAVE_' || comp_id, true, 5, 'Leave for marriage'),
        (comp_id, 'Study / Exam Leave', 'STUDY_LEAVE_' || comp_id, false, 10, 'Unpaid leave for studies or exams')
        ON CONFLICT (code) DO NOTHING;
    END LOOP;
END $$;
