export const i18n: { [lang: string]: { [key: string]: string } } = {
  vi: {
    // Core field labels
    Salutation: "Xưng hô",
    Full_Name: "Họ và tên",
    Email: "Email",
    Phone_Number: "Số điện thoại",
    
    // Form field labels
    "privacy policy": "Chính sách bảo mật",
    "clause": "Điều khoản",
    "company name": "Tên công ty",
    "business type": "Loại hình kinh doanh",
    "agree to receive information about new events": "Đồng ý nhận thông tin về sự kiện mới",
    "vietnam industrial automation exhibition": "Triển lãm Tự động hóa Công nghiệp Việt Nam",
    "vietnam vision exhibition": "Triển lãm Tầm nhìn Việt Nam",
    "smart factory exhibition": "Triển lãm Nhà máy Thông minh",
    "smart logistics exhibition": "Triển lãm Logistics Thông minh",
    "labor protection": "Bảo hộ lao động",
    "reason for visit (choose 1 or more)": "Lý do tham quan (chọn 1 hoặc nhiều)",
    "reason for knowing about this event (choose 1 or more)": "Lý do biết về sự kiện này (chọn 1 hoặc nhiều)",
    "purpose of visit": "Mục đích tham quan",
    "position": "Chức vụ",
    
    // Placeholders
    salutation_placeholder: "-- Chọn xưng hô --",
    full_name_placeholder: "Nhập họ và tên đầy đủ",
    email_placeholder: "example@email.com",
    phone_placeholder: "0912345678",
    
    // Error messages
    salutation_required: "Vui lòng chọn xưng hô.",
    full_name_required: "Vui lòng nhập họ và tên.",
    email_required: "Vui lòng nhập email.",
    email_invalid: "Định dạng email không hợp lệ.",
    phone_required: "Vui lòng nhập số điện thoại.",
    phone_invalid: "Số điện thoại không hợp lệ.",
    field_required: "Trường này là bắt buộc.",
    select_at_least_one: "Vui lòng chọn ít nhất một tùy chọn.",
    agreement_required: "Vui lòng đồng ý với điều khoản.",
    
    // Salutation options
    mr: "Ông",
    ms: "Cô", 
    mrs: "Bà",
    
    // Other
    register_title: "Đăng ký tham dự",
    company_info: "Thông tin công ty",
    thank_you: "Cảm ơn bạn đã đăng ký!",
    
    // Insight Page Translations
    // Tabs
    tab_checkin: "Check-in",
    tab_exhibitors: "Exhibitors", 
    tab_matching: "Matching",
    tab_agenda: "Agenda",
    tab_more: "Thêm",
    
    // Access Page
    access_dashboard: "Truy cập Dashboard",
    access_description: "Nhập mã truy cập được cung cấp bởi ban tổ chức",
    visitor_code_label: "Mã truy cập",
    visitor_code_placeholder: "Nhập mã truy cập của bạn",
    visitor_code_required: "Vui lòng nhập mã truy cập",
    access_button: "Truy cập Dashboard",
    no_visitor_code: "Chưa có mã truy cập?",
    security_note: "Mã truy cập của bạn được bảo vệ và chỉ có thể sử dụng cho sự kiện này.",
    
    // Error Messages
    invalid_visitor_code: "Mã truy cập không hợp lệ",
    visitor_code_not_exist: "Mã truy cập không hợp lệ hoặc không tồn tại",
    visitor_code_wrong_event: "Mã truy cập không thuộc sự kiện này. Visitor thuộc sự kiện:",
    check_visitor_code: "Vui lòng kiểm tra lại mã truy cập từ ban tổ chức.",
    reenter_visitor_code: "Nhập lại mã truy cập",
    try_again: "Thử lại",
    auto_redirect: "Tự động chuyển về trang nhập mã truy cập sau",
    seconds: "giây",
    
    // Dashboard Header
    registered_date: "Đăng ký:",
    status_active: "Active",
    status_ready: "Ready",
    
    // QR Section
    qr_mode_personal: "Cá nhân",
    qr_mode_group: "Nhóm", 
    qr_mode_badge: "Badge QR",
    qr_mode_redeem: "Redeem QR",
    qr_desc_badge: "Sử dụng QR này để truy cập các dịch vụ tại sự kiện",
    qr_desc_redeem: "Scan QR này để in lại thẻ đeo nếu bạn làm mất thẻ",
    qr_desc_personal: "Scan QR này để check-in cá nhân và nhận thẻ đeo",
    qr_desc_group: "Scan QR này để check-in theo nhóm và nhận thẻ đeo",
    qr_status_active: "Active Badge",
    qr_status_ready: "Check-in Ready",
    copy_qr_data: "Copy QR Data",
    qr_copy_success: "Đã copy QR data vào clipboard",
    qr_copy_error: "Không thể copy QR data",
    
    // Check-in History
    checkin_history: "Lịch sử check-in",
    checkin_entry: "Check-in",
    created_at: "Tạo lúc:",
    no_checkin_time: "Chưa có thời gian",
    submit: "Gửi đăng ký",
    required: "(bắt buộc)",
    optional: "(tùy chọn)",
    
    // Page states
    loading: "Đang tải dữ liệu sự kiện...",
    translating: "Đang dịch nội dung...",
    event_not_found: "Không tìm thấy sự kiện.",
    no_form_fields: "Không có form fields để hiển thị",
    
    // Buttons
    back: "Quay lại",
    continue: "Tiếp tục",
    add_member: "Thêm thành viên",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    save: "Lưu",
    cancel: "Hủy",
    confirm: "Xác nhận",
    confirm_delete: "Bạn có chắc muốn xóa thành viên này?",
    complete_registration: "Hoàn tất đăng ký",
    submitting: "Đang gửi...",
    
    // Section names
    personal_info: "THÔNG TIN CÁ NHÂN",
    agreement_section: "ĐIỀU KHOẢN",
    other_section: "KHÁC",
    
    // Thank You page
    thank_you_title: "Cảm ơn bạn đã đăng ký!",
    greeting: "Xin chào",
    registration_received: "Chúng tôi đã nhận được thông tin đăng ký của bạn. Vui lòng kiểm tra email",
    for_confirmation: "để xác nhận",
    qr_code_title: "Mã QR xác nhận",
    qr_code_instruction: "Vui lòng trình mã QR này khi đến sự kiện",
    group_qr_code: "Mã QR nhóm",
    registration_details: "Thông tin đăng ký",
    group_members: "Danh sách thành viên nhóm",
    back_to_home: "Quay về trang chủ",
    yes: "Có",
    no: "Không",
    
    // Common field values - keeping minimal set for UI consistency
    "xuất khẩu nhập khẩu": "Xuất khẩu nhập khẩu",
    "sản xuất": "Sản xuất",
    "phân phối": "Phân phối",
    "dịch vụ": "Dịch vụ"
  },
  en: {
    // Core field labels
    Salutation: "Salutation",
    Full_Name: "Full Name",
    Email: "Email",
    Phone_Number: "Phone Number",
    
    // Form field labels
    "privacy policy": "Privacy Policy",
    "clause": "Terms and Conditions",
    "company name": "Company Name",
    "business type": "Business Type",
    "agree to receive information about new events": "Agree to receive information about new events",
    "vietnam industrial automation exhibition": "Vietnam Industrial Automation Exhibition",
    "vietnam vision exhibition": "Vietnam Vision Exhibition",
    "smart factory exhibition": "Smart Factory Exhibition",
    "smart logistics exhibition": "Smart Logistics Exhibition",
    "labor protection": "Labor Protection",
    "reason for visit (choose 1 or more)": "Reason for visit (choose 1 or more)",
    "reason for knowing about this event (choose 1 or more)": "Reason for knowing about this event (choose 1 or more)",
    "purpose of visit": "Purpose of visit",
    "position": "Position",
    
    // Placeholders
    salutation_placeholder: "-- Select salutation --",
    full_name_placeholder: "Enter your full name",
    email_placeholder: "example@email.com",
    phone_placeholder: "+1234567890",
    
    // Error messages
    salutation_required: "Please select a salutation.",
    full_name_required: "Please enter your full name.",
    email_required: "Please enter your email.",
    email_invalid: "Invalid email format.",
    phone_required: "Please enter your phone number.",
    phone_invalid: "Invalid phone number.",
    field_required: "This field is required.",
    select_at_least_one: "Please select at least one option.",
    agreement_required: "Please agree to the terms.",
    
    // Salutation options
    mr: "Mr.",
    ms: "Ms.",
    mrs: "Mrs.",
    
    // Other
    register_title: "Register",
    company_info: "Company Information",
    
    // Insight Page Translations
    // Tabs
    tab_checkin: "Check-in",
    tab_exhibitors: "Exhibitors",
    tab_matching: "Matching", 
    tab_agenda: "Agenda",
    tab_more: "More",
    
    // Access Page
    access_dashboard: "Access Dashboard",
    access_description: "Enter the access code provided by the organizers",
    visitor_code_label: "Access Code",
    visitor_code_placeholder: "Enter your access code",
    visitor_code_required: "Please enter access code",
    access_button: "Access Dashboard",
    no_visitor_code: "Don't have an access code?",
    security_note: "Your access code is protected and can only be used for this event.",
    
    // Error Messages
    invalid_visitor_code: "Invalid access code",
    visitor_code_not_exist: "Access code is invalid or does not exist",
    visitor_code_wrong_event: "Access code does not belong to this event. Visitor belongs to event:",
    check_visitor_code: "Please check your access code from the organizers.",
    reenter_visitor_code: "Re-enter access code", 
    try_again: "Try again",
    auto_redirect: "Automatically redirecting to access code page in",
    seconds: "seconds",
    
    // Dashboard Header
    registered_date: "Registered:",
    status_active: "Active",
    status_ready: "Ready",
    
    // QR Section
    qr_mode_personal: "Personal",
    qr_mode_group: "Group",
    qr_mode_badge: "Badge QR", 
    qr_mode_redeem: "Redeem QR",
    qr_desc_badge: "Use this QR to access services at the event",
    qr_desc_redeem: "Scan this QR to reprint your badge if you lose it",
    qr_desc_personal: "Scan this QR for personal check-in and receive badge",
    qr_desc_group: "Scan this QR for group check-in and receive badge",
    qr_status_active: "Active Badge",
    qr_status_ready: "Check-in Ready",
    copy_qr_data: "Copy QR Data",
    qr_copy_success: "QR data copied to clipboard",
    qr_copy_error: "Unable to copy QR data",
    
    // Check-in History
    checkin_history: "Check-in History",
    checkin_entry: "Check-in",
    created_at: "Created at:",
    no_checkin_time: "No check-in time",
    thank_you: "Thank you for registering!",
    submit: "Submit",
    required: "(required)",
    optional: "(optional)",
    
    // Page states
    loading: "Loading event data...",
    translating: "Translating content...",
    event_not_found: "Event not found.",
    no_form_fields: "No form fields to display",
    
    // Buttons
    back: "Back",
    continue: "Continue",
    add_member: "Add Member",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    confirm_delete: "Are you sure you want to delete this member?",
    complete_registration: "Complete Registration",
    submitting: "Submitting...",
    
    // Section names
    personal_info: "PERSONAL INFORMATION",
    agreement_section: "AGREEMENT",
    other_section: "OTHER",
    
    // Thank You page
    thank_you_title: "Thank you for registering!",
    greeting: "Hello",
    registration_received: "We have received your registration information. Please check your email",
    for_confirmation: "for confirmation",
    qr_code_title: "Confirmation QR Code",
    qr_code_instruction: "Please present this QR code when you arrive at the event",
    group_qr_code: "Group QR Code",
    registration_details: "Registration Details",
    group_members: "Group Members List",
    back_to_home: "Back to Home",
    yes: "Yes",
    no: "No",
    
    // Common field values - keeping minimal set for UI consistency
    "xuất khẩu nhập khẩu": "Export/Import",
    "sản xuất": "Manufacturing",
    "phân phối": "Distribution",
    "dịch vụ": "Service"
  },
}; 