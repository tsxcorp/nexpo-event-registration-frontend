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
    submit: "Gửi đăng ký",
    required: "(bắt buộc)",
    optional: "(tùy chọn)",
    
    // Page states
    loading: "Đang tải dữ liệu sự kiện...",
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
    thank_you: "Thank you for registering!",
    submit: "Submit",
    required: "(required)",
    optional: "(optional)",
    
    // Page states
    loading: "Loading event data...",
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