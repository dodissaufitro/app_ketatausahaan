# 📊 ACTIVITY DIAGRAM - SISTEM APLIKASI KETATAUSAHAAN
**Business Process Flowcharts & Activity Diagrams**

---

## 🎯 OVERVIEW ACTIVITY DIAGRAMS

Activity Diagram ini menunjukkan alur kerja (workflow) dan proses bisnis dari berbagai modul dalam Sistem Aplikasi Ketatausahaan, mencakup decision points, parallel activities, dan exception handling.

---

## 🔄 DAFTAR ACTIVITY DIAGRAMS

### **Core Business Processes:**
1. **Login & Authentication Process** - Proses masuk sistem
2. **Employee Registration Process** - Proses pendaftaran karyawan baru 
3. **X601 Attendance Sync Process** - Sinkronisasi absensi otomatis
4. **Monthly Payroll Generation** - Proses generate gaji bulanan
5. **Leave Request & Approval** - Workflow permohonan cuti
6. **Document Management Process** - Proses kelola dokumen
7. **Transportation Recording** - Proses pencatatan transportasi
8. **Procurement Workflow** - Alur pengadaan barang/jasa

---

## 1. 🔐 LOGIN & AUTHENTICATION PROCESS

```mermaid
flowchart TD
    START([🚀 Start]) --> INPUT[📝 User Input Credentials]
    INPUT --> VALIDATE{🔍 Validate Credentials?}
    
    VALIDATE -->|❌ Invalid| ERROR[⚠️ Show Error Message]
    ERROR --> INPUT
    
    VALIDATE -->|✅ Valid| CHECKROLE{👤 Check User Role}
    
    CHECKROLE -->|👨‍💼 Admin| ADMIN_DASH[🏢 Load Admin Dashboard]
    CHECKROLE -->|👥 HRD| HRD_DASH[👔 Load HRD Dashboard]  
    CHECKROLE -->|📋 Staff| STAFF_DASH[📊 Load Staff Dashboard]
    CHECKROLE -->|👤 Employee| EMP_DASH[👤 Load Employee Portal]
    
    ADMIN_DASH --> LOG_ACTIVITY[📋 Log Login Activity]
    HRD_DASH --> LOG_ACTIVITY
    STAFF_DASH --> LOG_ACTIVITY
    EMP_DASH --> LOG_ACTIVITY
    
    LOG_ACTIVITY --> SESSION[🔒 Create User Session]
    SESSION --> END([✅ Login Success])
    
    %% Styling
    classDef startend fill:#000000,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef process fill:#1976d2,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef decision fill:#d32f2f,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef error fill:#ff5722,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef success fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class START,END startend
    class INPUT,LOG_ACTIVITY,SESSION process
    class VALIDATE,CHECKROLE decision
    class ERROR error
    class ADMIN_DASH,HRD_DASH,STAFF_DASH,EMP_DASH success
```

---

## 2. 👥 EMPLOYEE REGISTRATION PROCESS

```mermaid
flowchart TD
    START([🚀 Start Registration]) --> CHECK_ACCESS{🔐 Admin/HRD Access?}
    
    CHECK_ACCESS -->|❌ No Access| DENY[🚫 Access Denied]
    DENY --> END_DENY([❌ End])
    
    CHECK_ACCESS -->|✅ Authorized| SELECT_USER[👤 Select User from Table]
    SELECT_USER --> VALIDATE_USER{✅ User Valid & Available?}
    
    VALIDATE_USER -->|❌ Invalid/Used| ERROR[⚠️ Show Error: User Invalid]
    ERROR --> SELECT_USER
    
    VALIDATE_USER -->|✅ Valid| FILL_FORM[📝 Auto-fill Employee Form]
    FILL_FORM --> INPUT_DETAILS[➕ Add Additional Details<br/>• Salary<br/>• Position<br/>• Department]
    
    INPUT_DETAILS --> VALIDATE_FORM{📋 Form Valid?}
    VALIDATE_FORM -->|❌ Invalid| FORM_ERROR[⚠️ Show Validation Error]
    FORM_ERROR --> INPUT_DETAILS
    
    VALIDATE_FORM -->|✅ Valid| SAVE_DB[💾 Save to Database]
    SAVE_DB --> SUCCESS_CHECK{💾 Save Successful?}
    
    SUCCESS_CHECK -->|❌ DB Error| DB_ERROR[⚠️ Database Error]
    DB_ERROR --> INPUT_DETAILS
    
    SUCCESS_CHECK -->|✅ Success| UPDATE_USER[🔄 Update User Status]
    UPDATE_USER --> SEND_NOTIF[📧 Send Welcome Email]
    SEND_NOTIF --> LOG_ACTION[📋 Log Admin Action]
    LOG_ACTION --> SUCCESS[✅ Employee Created Successfully]
    SUCCESS --> END([✅ End Success])
    
    %% Styling
    classDef startend fill:#000000,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef process fill:#1976d2,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef decision fill:#d32f2f,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef error fill:#ff5722,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef success fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class START,END,END_DENY startend
    class SELECT_USER,FILL_FORM,INPUT_DETAILS,SAVE_DB,UPDATE_USER,SEND_NOTIF,LOG_ACTION process
    class CHECK_ACCESS,VALIDATE_USER,VALIDATE_FORM,SUCCESS_CHECK decision
    class DENY,ERROR,FORM_ERROR,DB_ERROR error
    class SUCCESS success
```

---

## 3. ⏰ X601 ATTENDANCE SYNC PROCESS

```mermaid
flowchart TD
    START([🚀 Start Sync]) --> TRIGGER{🔄 Sync Trigger?}
    
    TRIGGER -->|⏰ Scheduled| AUTO[🤖 Automated Sync]
    TRIGGER -->|👤 Manual| MANUAL[👨‍💼 Admin Initiated]
    
    AUTO --> CHECK_CONNECTION
    MANUAL --> CHECK_CONNECTION[🔗 Check X601 Connection]
    
    CHECK_CONNECTION --> CONNECTION_OK{📡 Connection OK?}
    
    CONNECTION_OK -->|❌ Failed| CONN_ERROR[⚠️ Connection Error]
    CONN_ERROR --> RETRY{🔄 Retry?}
    RETRY -->|✅ Yes| CHECK_CONNECTION
    RETRY -->|❌ No| LOG_ERROR[📋 Log Error]
    LOG_ERROR --> END_ERROR([❌ Sync Failed])
    
    CONNECTION_OK -->|✅ Success| FETCH_DATA[📥 Fetch Attendance Data]
    FETCH_DATA --> DATA_VALID{📋 Data Valid?}
    
    DATA_VALID -->|❌ Invalid| DATA_ERROR[⚠️ Invalid Data Format]
    DATA_ERROR --> LOG_ERROR
    
    DATA_VALID -->|✅ Valid| PROCESS_RECORDS[🔄 Process Each Record]
    PROCESS_RECORDS --> CHECK_EMPLOYEE{👤 Employee Exists?}
    
    CHECK_EMPLOYEE -->|❌ Not Found| SKIP_RECORD[⏭️ Skip Record]
    SKIP_RECORD --> MORE_RECORDS{📋 More Records?}
    
    CHECK_EMPLOYEE -->|✅ Found| CHECK_DUPLICATE{📅 Duplicate Entry?}
    CHECK_DUPLICATE -->|✅ Duplicate| UPDATE_RECORD[🔄 Update Existing]
    CHECK_DUPLICATE -->|❌ New| CREATE_RECORD[➕ Create New Record]
    
    UPDATE_RECORD --> MORE_RECORDS
    CREATE_RECORD --> MORE_RECORDS
    
    MORE_RECORDS -->|✅ Yes| PROCESS_RECORDS
    MORE_RECORDS -->|❌ No| UPDATE_CACHE[💾 Update Cache]
    
    UPDATE_CACHE --> SEND_NOTIF[📧 Send Notifications]
    SEND_NOTIF --> LOG_SUCCESS[📋 Log Successful Sync]
    LOG_SUCCESS --> SUCCESS[✅ Sync Completed]
    SUCCESS --> END([✅ End Success])
    
    %% Styling with high contrast
    classDef startend fill:#000000,stroke:#ffffff,stroke-width:4px,color:#ffffff
    classDef process fill:#0d47a1,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef decision fill:#d32f2f,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef error fill:#ff5722,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef success fill:#2e7d32,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef skip fill:#ff9800,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class START,END,END_ERROR startend
    class AUTO,MANUAL,CHECK_CONNECTION,FETCH_DATA,PROCESS_RECORDS,UPDATE_RECORD,CREATE_RECORD,UPDATE_CACHE,SEND_NOTIF,LOG_SUCCESS,LOG_ERROR process
    class TRIGGER,CONNECTION_OK,DATA_VALID,CHECK_EMPLOYEE,CHECK_DUPLICATE,MORE_RECORDS,RETRY decision
    class CONN_ERROR,DATA_ERROR error
    class SUCCESS success
    class SKIP_RECORD skip
```

---

## 4. 💰 MONTHLY PAYROLL GENERATION PROCESS

```mermaid
flowchart TD
    START([🚀 Start Payroll]) --> CHECK_AUTH{🔐 HRD/Admin Access?}
    
    CHECK_AUTH -->|❌ No Access| DENY[🚫 Access Denied]
    DENY --> END_DENY([❌ End])
    
    CHECK_AUTH -->|✅ Authorized| SELECT_MONTH[📅 Select Month/Year]
    SELECT_MONTH --> CHECK_PERIOD{📋 Valid Period?}
    
    CHECK_PERIOD -->|❌ Invalid| PERIOD_ERROR[⚠️ Invalid Period]
    PERIOD_ERROR --> SELECT_MONTH
    
    CHECK_PERIOD -->|✅ Valid| FETCH_EMPLOYEES[👥 Fetch Active Employees]
    FETCH_EMPLOYEES --> PROCESS_EACH[🔄 Process Each Employee]
    
    PROCESS_EACH --> GET_ATTENDANCE[⏰ Get Attendance Data]
    GET_ATTENDANCE --> ATTENDANCE_OK{📊 Attendance Available?}
    
    ATTENDANCE_OK -->|❌ No Data| USE_DEFAULT[📋 Use Default Hours]
    ATTENDANCE_OK -->|✅ Available| CALC_HOURS[🧮 Calculate Working Hours]
    
    USE_DEFAULT --> GET_SALARY
    CALC_HOURS --> GET_SALARY[💰 Get Base Salary]
    
    GET_SALARY --> CALC_DEDUCTIONS[➖ Calculate Deductions<br/>• Late Penalty<br/>• Absent Days<br/>• Other Deductions]
    
    CALC_DEDUCTIONS --> CALC_TOTAL[🧮 Calculate Total Salary<br/>Base - Deductions]
    CALC_TOTAL --> SAVE_PAYROLL[💾 Save Payroll Record]
    
    SAVE_PAYROLL --> SAVE_OK{💾 Save Successful?}
    SAVE_OK -->|❌ Error| SAVE_ERROR[⚠️ Save Failed]
    SAVE_ERROR --> NEXT_EMPLOYEE{👤 Next Employee?}
    
    SAVE_OK -->|✅ Success| GEN_PAYSLIP[📄 Generate Payslip PDF]
    GEN_PAYSLIP --> NEXT_EMPLOYEE
    
    NEXT_EMPLOYEE -->|✅ Yes| PROCESS_EACH
    NEXT_EMPLOYEE -->|❌ No| SEND_SUMMARY[📧 Send Summary Report]
    
    SEND_SUMMARY --> LOG_PROCESS[📋 Log Payroll Process]
    LOG_PROCESS --> SUCCESS[✅ Payroll Generated]
    SUCCESS --> END([✅ End Success])
    
    %% Styling
    classDef startend fill:#000000,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef process fill:#7b1fa2,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef decision fill:#d32f2f,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef error fill:#ff5722,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef success fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef calculation fill:#ff9800,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class START,END,END_DENY startend
    class SELECT_MONTH,FETCH_EMPLOYEES,PROCESS_EACH,GET_ATTENDANCE,GET_SALARY,SAVE_PAYROLL,GEN_PAYSLIP,SEND_SUMMARY,LOG_PROCESS process
    class CHECK_AUTH,CHECK_PERIOD,ATTENDANCE_OK,SAVE_OK,NEXT_EMPLOYEE decision
    class DENY,PERIOD_ERROR,SAVE_ERROR error
    class SUCCESS success
    class USE_DEFAULT,CALC_HOURS,CALC_DEDUCTIONS,CALC_TOTAL calculation
```

---

## 5. 🏖️ LEAVE REQUEST & APPROVAL PROCESS

```mermaid
flowchart TD
    START([🚀 Start Leave Request]) --> EMP_LOGIN[👤 Employee Login]
    EMP_LOGIN --> SELECT_TYPE[📋 Select Leave Type<br/>• Annual Leave<br/>• Sick Leave<br/>• Emergency<br/>• Other]
    
    SELECT_TYPE --> SET_DATES[📅 Set Start & End Date]
    SET_DATES --> CHECK_BALANCE{💳 Check Leave Balance}
    
    CHECK_BALANCE -->|❌ Insufficient| BALANCE_ERROR[⚠️ Insufficient Balance]
    BALANCE_ERROR --> SELECT_TYPE
    
    CHECK_BALANCE -->|✅ Available| ADD_REASON[📝 Add Reason/Description]
    ADD_REASON --> UPLOAD_DOC[📎 Upload Supporting Document<br/>(Optional)]
    
    UPLOAD_DOC --> VALIDATE_FORM{📋 Form Valid?}
    VALIDATE_FORM -->|❌ Invalid| FORM_ERROR[⚠️ Validation Error]
    FORM_ERROR --> ADD_REASON
    
    VALIDATE_FORM -->|✅ Valid| SUBMIT_REQUEST[📤 Submit Request]
    SUBMIT_REQUEST --> SAVE_REQUEST[💾 Save to Database]
    
    SAVE_REQUEST --> NOTIFY_HRD[📧 Notify HRD/Supervisor]
    NOTIFY_HRD --> PENDING[⏳ Status: Pending Approval]
    
    PENDING --> HRD_REVIEW[👥 HRD Reviews Request]
    HRD_REVIEW --> HRD_DECISION{✅ Approve or Reject?}
    
    HRD_DECISION -->|❌ Reject| REJECT_PROCESS[❌ Reject Request]
    REJECT_PROCESS --> ADD_REJECT_REASON[📝 Add Rejection Reason]
    ADD_REJECT_REASON --> NOTIFY_EMPLOYEE_REJECT[📧 Notify Employee - Rejected]
    NOTIFY_EMPLOYEE_REJECT --> UPDATE_STATUS_REJECT[📋 Update Status: Rejected]
    UPDATE_STATUS_REJECT --> END_REJECT([❌ Request Rejected])
    
    HRD_DECISION -->|✅ Approve| APPROVE_PROCESS[✅ Approve Request]
    APPROVE_PROCESS --> DEDUCT_BALANCE[➖ Deduct Leave Balance]
    DEDUCT_BALANCE --> NOTIFY_EMPLOYEE_APPROVE[📧 Notify Employee - Approved]
    
    NOTIFY_EMPLOYEE_APPROVE --> UPDATE_STATUS_APPROVE[📋 Update Status: Approved]
    UPDATE_STATUS_APPROVE --> LOG_APPROVAL[📋 Log Approval Action]
    LOG_APPROVAL --> SUCCESS[✅ Leave Approved]
    SUCCESS --> END([✅ End Success])
    
    %% Styling
    classDef startend fill:#000000,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef process fill:#1976d2,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef decision fill:#d32f2f,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef error fill:#ff5722,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef success fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef pending fill:#ff9800,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef reject fill:#e91e63,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class START,END,END_REJECT startend
    class EMP_LOGIN,SELECT_TYPE,SET_DATES,ADD_REASON,UPLOAD_DOC,SUBMIT_REQUEST,SAVE_REQUEST,NOTIFY_HRD,HRD_REVIEW,DEDUCT_BALANCE,NOTIFY_EMPLOYEE_APPROVE,NOTIFY_EMPLOYEE_REJECT,UPDATE_STATUS_APPROVE,UPDATE_STATUS_REJECT,LOG_APPROVAL process
    class CHECK_BALANCE,VALIDATE_FORM,HRD_DECISION decision
    class BALANCE_ERROR,FORM_ERROR error
    class SUCCESS success
    class PENDING pending
    class REJECT_PROCESS,ADD_REJECT_REASON reject
```

---

## 6. 📄 DOCUMENT MANAGEMENT PROCESS

```mermaid
flowchart TD
    START([🚀 Start Document Process]) --> PROCESS_TYPE{📋 Process Type?}
    
    PROCESS_TYPE -->|📥 Incoming| INCOMING[📥 Incoming Mail Process]
    PROCESS_TYPE -->|📤 Outgoing| OUTGOING[📤 Outgoing Mail Process]
    PROCESS_TYPE -->|🔍 Search| SEARCH[🔍 Document Search]
    
    %% Incoming Mail Flow
    INCOMING --> INPUT_INCOMING[📝 Input Mail Details<br/>• Sender<br/>• Subject<br/>• Date Received<br/>• Priority]
    INPUT_INCOMING --> SCAN_DOC[📷 Scan/Upload Document]
    SCAN_DOC --> CATEGORIZE[📊 Categorize Document]
    CATEGORIZE --> ASSIGN_NUMBER[🔢 Assign Mail Number]
    ASSIGN_NUMBER --> DISPOSITION{📋 Requires Disposition?}
    
    DISPOSITION -->|❌ No| ARCHIVE_INCOMING[🗃️ Archive Document]
    DISPOSITION -->|✅ Yes| SET_DISPOSITION[📤 Set Disposition<br/>• To Department<br/>• To Person<br/>• Action Required]
    
    SET_DISPOSITION --> NOTIFY_RECIPIENT[📧 Notify Recipient]
    NOTIFY_RECIPIENT --> TRACK_DISPOSITION[📊 Track Disposition Status]
    TRACK_DISPOSITION --> ARCHIVE_INCOMING
    
    %% Outgoing Mail Flow  
    OUTGOING --> INPUT_OUTGOING[📝 Input Mail Details<br/>• Recipient<br/>• Subject<br/>• Content<br/>• Priority]
    INPUT_OUTGOING --> ATTACH_FILES[📎 Attach Files/Documents]
    ATTACH_FILES --> SET_APPROVAL{✅ Requires Approval?}
    
    SET_APPROVAL -->|❌ No| SEND_DIRECTLY[📤 Send Directly]
    SET_APPROVAL -->|✅ Yes| REQUEST_APPROVAL[👨‍💼 Request Supervisor Approval]
    REQUEST_APPROVAL --> APPROVAL_DECISION{✅ Approved?}
    
    APPROVAL_DECISION -->|❌ Rejected| REJECT_MAIL[❌ Mail Rejected]
    REJECT_MAIL --> NOTIFY_SENDER_REJECT[📧 Notify Sender - Rejected]
    NOTIFY_SENDER_REJECT --> END_REJECT([❌ Mail Rejected])
    
    APPROVAL_DECISION -->|✅ Approved| SEND_DIRECTLY
    SEND_DIRECTLY --> ASSIGN_OUT_NUMBER[🔢 Assign Outgoing Number]
    ASSIGN_OUT_NUMBER --> ARCHIVE_OUTGOING[🗃️ Archive Outgoing Mail]
    
    %% Search Flow
    SEARCH --> INPUT_CRITERIA[🔍 Input Search Criteria<br/>• Date Range<br/>• Sender/Recipient<br/>• Subject<br/>• Keywords]
    INPUT_CRITERIA --> EXECUTE_SEARCH[🔍 Execute Search]
    EXECUTE_SEARCH --> DISPLAY_RESULTS[📊 Display Results]
    DISPLAY_RESULTS --> SELECT_DOC{📄 Select Document?}
    
    SELECT_DOC -->|✅ Yes| OPEN_DOCUMENT[📖 Open Document]
    SELECT_DOC -->|❌ No| END_SEARCH([🔍 End Search])
    OPEN_DOCUMENT --> END_SEARCH
    
    %% Common End Points
    ARCHIVE_INCOMING --> SUCCESS[✅ Document Processed]
    ARCHIVE_OUTGOING --> SUCCESS
    SUCCESS --> END([✅ End Success])
    
    %% Styling
    classDef startend fill:#000000,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef process fill:#673ab7,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef decision fill:#d32f2f,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef incoming fill:#2196f3,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef outgoing fill:#ff9800,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef search fill:#4caf50,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef success fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef reject fill:#e91e63,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class START,END,END_REJECT,END_SEARCH startend
    class INPUT_INCOMING,SCAN_DOC,CATEGORIZE,ASSIGN_NUMBER,SET_DISPOSITION,NOTIFY_RECIPIENT,TRACK_DISPOSITION,ARCHIVE_INCOMING incoming
    class INPUT_OUTGOING,ATTACH_FILES,SEND_DIRECTLY,REQUEST_APPROVAL,ASSIGN_OUT_NUMBER,ARCHIVE_OUTGOING,NOTIFY_SENDER_REJECT outgoing
    class INPUT_CRITERIA,EXECUTE_SEARCH,DISPLAY_RESULTS,OPEN_DOCUMENT search
    class PROCESS_TYPE,DISPOSITION,SET_APPROVAL,APPROVAL_DECISION,SELECT_DOC decision
    class SUCCESS success
    class REJECT_MAIL reject
```

---

## 7. 🚗 TRANSPORTATION RECORDING PROCESS

```mermaid
flowchart TD
    START([🚀 Start Transport Record]) --> EMP_ACCESS{👤 Employee Access?}
    
    EMP_ACCESS -->|❌ No Access| DENY[🚫 Access Denied]
    DENY --> END_DENY([❌ End])
    
    EMP_ACCESS -->|✅ Authorized| INPUT_DETAILS[📝 Input Transport Details<br/>• Full Name<br/>• Date<br/>• Position<br/>• Transport Type]
    
    INPUT_DETAILS --> VALIDATE_INPUT{📋 Input Valid?}
    VALIDATE_INPUT -->|❌ Invalid| INPUT_ERROR[⚠️ Validation Error]
    INPUT_ERROR --> INPUT_DETAILS
    
    VALIDATE_INPUT -->|✅ Valid| CAPTURE_DEPARTURE[📸 Capture Departure Photo<br/>with Timestamp]
    CAPTURE_DEPARTURE --> PHOTO_OK{📷 Photo Captured?}
    
    PHOTO_OK -->|❌ Failed| PHOTO_ERROR[⚠️ Photo Capture Failed]
    PHOTO_ERROR --> CAPTURE_DEPARTURE
    
    PHOTO_OK -->|✅ Success| SAVE_DEPARTURE[💾 Save Departure Data]
    SAVE_DEPARTURE --> TRAVEL_MODE[🚌 Travel Period<br/>Employee using transport]
    
    TRAVEL_MODE --> RETURN_TIME{⏰ Return Time?}
    RETURN_TIME -->|⏳ Not Yet| WAIT[⏳ Wait for Return]
    WAIT --> RETURN_TIME
    
    RETURN_TIME -->|✅ Returned| CAPTURE_RETURN[📸 Capture Return Photo<br/>with Timestamp]
    CAPTURE_RETURN --> RETURN_PHOTO_OK{📷 Photo Captured?}
    
    RETURN_PHOTO_OK -->|❌ Failed| RETURN_PHOTO_ERROR[⚠️ Return Photo Failed]
    RETURN_PHOTO_ERROR --> CAPTURE_RETURN
    
    RETURN_PHOTO_OK -->|✅ Success| SAVE_RETURN[💾 Save Return Data]
    SAVE_RETURN --> CALC_DURATION[🧮 Calculate Journey Duration]
    
    CALC_DURATION --> SAVE_COMPLETE[💾 Save Complete Record]
    SAVE_COMPLETE --> SAVE_CHECK{💾 Save Successful?}
    
    SAVE_CHECK -->|❌ Failed| SAVE_ERROR[⚠️ Save Failed]
    SAVE_ERROR --> CAPTURE_DEPARTURE
    
    SAVE_CHECK -->|✅ Success| NOTIFY_SUPERVISOR[📧 Notify Supervisor]
    NOTIFY_SUPERVISOR --> LOG_TRANSPORT[📋 Log Transport Record]
    LOG_TRANSPORT --> SUCCESS[✅ Transport Recorded]
    SUCCESS --> END([✅ End Success])
    
    %% Styling
    classDef startend fill:#000000,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef process fill:#795548,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef decision fill:#d32f2f,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef error fill:#ff5722,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef success fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef photo fill:#ff9800,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef wait fill:#9c27b0,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class START,END,END_DENY startend
    class INPUT_DETAILS,SAVE_DEPARTURE,SAVE_RETURN,CALC_DURATION,SAVE_COMPLETE,NOTIFY_SUPERVISOR,LOG_TRANSPORT process
    class EMP_ACCESS,VALIDATE_INPUT,PHOTO_OK,RETURN_TIME,RETURN_PHOTO_OK,SAVE_CHECK decision
    class DENY,INPUT_ERROR,PHOTO_ERROR,RETURN_PHOTO_ERROR,SAVE_ERROR error
    class SUCCESS success
    class CAPTURE_DEPARTURE,CAPTURE_RETURN photo
    class TRAVEL_MODE,WAIT wait
```

---

## 8. 🛒 PROCUREMENT WORKFLOW PROCESS

```mermaid
flowchart TD
    START([🚀 Start Procurement]) --> STAFF_ACCESS{📋 Staff Admin Access?}
    
    STAFF_ACCESS -->|❌ No Access| DENY[🚫 Access Denied]
    DENY --> END_DENY([❌ End])
    
    STAFF_ACCESS -->|✅ Authorized| CREATE_REQUEST[📝 Create Procurement Request<br/>• Item/Service Name<br/>• Budget Amount<br/>• Date<br/>• Procurement Type]
    
    CREATE_REQUEST --> VALIDATE_REQUEST{📋 Request Valid?}
    VALIDATE_REQUEST -->|❌ Invalid| REQUEST_ERROR[⚠️ Validation Error]
    REQUEST_ERROR --> CREATE_REQUEST
    
    VALIDATE_REQUEST -->|✅ Valid| ASSIGN_ROLES[👥 Assign Roles<br/>• PPTK (User)<br/>• ASN (User)<br/>• Non-ASN (User)]
    
    ASSIGN_ROLES --> VALIDATE_ASSIGNMENT{✅ Assignments Valid?}
    VALIDATE_ASSIGNMENT -->|❌ Invalid| ASSIGNMENT_ERROR[⚠️ Invalid User Assignment]
    ASSIGNMENT_ERROR --> ASSIGN_ROLES
    
    VALIDATE_ASSIGNMENT -->|✅ Valid| SAVE_REQUEST[💾 Save Procurement Request]
    SAVE_REQUEST --> CHECK_BUDGET[💰 Check Budget Availability]
    
    CHECK_BUDGET --> BUDGET_OK{💰 Budget Sufficient?}
    BUDGET_OK -->|❌ Insufficient| BUDGET_ERROR[⚠️ Insufficient Budget]
    BUDGET_ERROR --> CREATE_REQUEST
    
    BUDGET_OK -->|✅ Available| RESERVE_BUDGET[🔒 Reserve Budget Amount]
    RESERVE_BUDGET --> UPLOAD_DOCS[📎 Upload Supporting Documents<br/>• Specifications<br/>• Quotations<br/>• Other Requirements]
    
    UPLOAD_DOCS --> DOCS_COMPLETE{📋 Documents Complete?}
    DOCS_COMPLETE -->|❌ Incomplete| DOC_ERROR[⚠️ Documents Incomplete]
    DOC_ERROR --> UPLOAD_DOCS
    
    DOCS_COMPLETE -->|✅ Complete| NOTIFY_PPTK[📧 Notify PPTK]
    NOTIFY_PPTK --> PPTK_REVIEW[👨‍💼 PPTK Reviews Request]
    
    PPTK_REVIEW --> PPTK_DECISION{✅ PPTK Approval?}
    PPTK_DECISION -->|❌ Rejected| PPTK_REJECT[❌ PPTK Rejects]
    PPTK_REJECT --> ADD_PPTK_REASON[📝 Add Rejection Reason]
    ADD_PPTK_REASON --> RELEASE_BUDGET[🔓 Release Reserved Budget]
    RELEASE_BUDGET --> NOTIFY_STAFF_REJECT[📧 Notify Staff - Rejected]
    NOTIFY_STAFF_REJECT --> END_REJECT([❌ Procurement Rejected])
    
    PPTK_DECISION -->|✅ Approved| TRACK_REALTIME[📊 Start Real-time Tracking]
    TRACK_REALTIME --> PROCUREMENT_PROCESS[🛒 Execute Procurement Process]
    PROCUREMENT_PROCESS --> UPDATE_STATUS[📋 Update Status Regularly]
    
    UPDATE_STATUS --> PROCESS_COMPLETE{✅ Process Complete?}
    PROCESS_COMPLETE -->|❌ Ongoing| TRACK_REALTIME
    
    PROCESS_COMPLETE -->|✅ Complete| FINALIZE_BUDGET[💰 Finalize Budget Usage]
    FINALIZE_BUDGET --> GENERATE_REPORT[📊 Generate Final Report]
    GENERATE_REPORT --> ARCHIVE_DOCS[🗃️ Archive All Documents]
    
    ARCHIVE_DOCS --> LOG_COMPLETION[📋 Log Procurement Completion]
    LOG_COMPLETION --> SUCCESS[✅ Procurement Complete]
    SUCCESS --> END([✅ End Success])
    
    %% Styling
    classDef startend fill:#000000,stroke:#ffffff,stroke-width:3px,color:#ffffff
    classDef process fill:#3f51b5,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef decision fill:#d32f2f,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef error fill:#ff5722,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef success fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef budget fill:#ff9800,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef tracking fill:#9c27b0,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef reject fill:#e91e63,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class START,END,END_DENY,END_REJECT startend
    class CREATE_REQUEST,ASSIGN_ROLES,SAVE_REQUEST,UPLOAD_DOCS,NOTIFY_PPTK,PPTK_REVIEW,PROCUREMENT_PROCESS,UPDATE_STATUS,GENERATE_REPORT,ARCHIVE_DOCS,LOG_COMPLETION,NOTIFY_STAFF_REJECT process
    class STAFF_ACCESS,VALIDATE_REQUEST,VALIDATE_ASSIGNMENT,BUDGET_OK,DOCS_COMPLETE,PPTK_DECISION,PROCESS_COMPLETE decision
    class DENY,REQUEST_ERROR,ASSIGNMENT_ERROR,BUDGET_ERROR,DOC_ERROR error
    class SUCCESS success
    class CHECK_BUDGET,RESERVE_BUDGET,FINALIZE_BUDGET budget
    class TRACK_REALTIME tracking
    class PPTK_REJECT,ADD_PPTK_REASON,RELEASE_BUDGET reject
```

---

## 📊 SUMMARY ACTIVITY DIAGRAMS

### **📋 Process Complexity Analysis:**

| Process | Complexity | Decision Points | Error Handling | Integration |
|---------|------------|----------------|----------------|-------------|
| **Login & Auth** | ⭐⭐ Low | 2 | Basic | Session Mgmt |
| **Employee Registration** | ⭐⭐⭐ Medium | 4 | Comprehensive | User Table |
| **X601 Sync** | ⭐⭐⭐⭐ High | 8 | Advanced | Hardware API |
| **Payroll Generation** | ⭐⭐⭐⭐ High | 6 | Business Logic | Attendance |
| **Leave Request** | ⭐⭐⭐ Medium | 5 | Workflow | Email Notif |
| **Document Management** | ⭐⭐⭐⭐ High | 7 | Multi-path | File Storage |
| **Transport Recording** | ⭐⭐⭐ Medium | 6 | Photo Handling | Mobile Ready |
| **Procurement** | ⭐⭐⭐⭐⭐ Very High | 9 | Complex Workflow | Budget System |

### **🎯 Key Features Highlighted:**

✅ **Error Handling** - Comprehensive validation & retry logic  
✅ **Decision Points** - Clear business rule implementation  
✅ **Integration Points** - External system connections  
✅ **User Experience** - Smooth workflow transitions  
✅ **Security** - Role-based access controls  
✅ **Audit Trail** - Complete logging & tracking  
✅ **Real-time Updates** - Status monitoring  
✅ **Notification System** - Email alerts & updates  

### **🔧 Implementation Notes:**

- **Parallel Processing** where applicable (Payroll, Sync)
- **Retry Mechanisms** for system integrations  
- **Status Tracking** for long-running processes
- **Rollback Procedures** for failed transactions
- **Cache Management** for performance optimization

---

*📅 Created: March 4, 2026*  
*🎯 Status: Ready for Implementation*  
*📋 Total Diagrams: 8 Core Business Processes*