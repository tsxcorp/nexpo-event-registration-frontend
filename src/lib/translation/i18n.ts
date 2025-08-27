export const i18n: { [lang: string]: { [key: string]: string } } = {
  vi: {
    // Core field labels
    Salutation: "Xưng hô",
    Full_Name: "Họ và tên",
    Email: "Email",
    Phone_Number: "Số điện thoại",
    
    
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
    tab_exhibitors: "Nhà Triễn Lãm",
    tab_matching: "Kết Nối",
    tab_agenda: "Lịch trình",
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
    status_active: "Đang hoạt động",
    status_ready: "Sẵn sàng",
    
    // QR Section
    qr_mode_personal: "Cá nhân",
    qr_mode_group: "Nhóm", 
    qr_mode_badge: "Mã QR Khách Tham Dự",
    qr_mode_redeem: "Mã QR In Thẻ",
    qr_desc_badge: "Sử dụng QR này để truy cập các dịch vụ tại sự kiện",
    qr_desc_redeem: "Quét QR này để in lại thẻ đeo nếu bạn làm mất thẻ",
    qr_desc_personal: "Quét QR này để check-in cá nhân và nhận thẻ đeo",
    qr_desc_group: "Quét QR này để check-in theo nhóm và nhận thẻ đeo",
    qr_status_active: "Badge đang hoạt động",
    qr_status_ready: "Sẵn sàng Check-in",
    copy_qr_data: "Sao chép dữ liệu QR",
    qr_copy_success: "Đã sao chép dữ liệu QR vào clipboard",
    qr_copy_error: "Không thể sao chép dữ liệu QR",
    
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
    no_form_fields: "Không có trường biểu mẫu để hiển thị",
    
    // Payment Page
    registration_successful: "Đăng ký thành công!",
    thank_you_for_registration: "Cảm ơn bạn đã đăng ký tham gia sự kiện của chúng tôi.",
    registration_summary: "Thông tin đăng ký",
    event_information: "Thông tin sự kiện",
    payment_notice: "Thông báo thanh toán",
    payment_notice_description: "Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để hướng dẫn quy trình thanh toán và cung cấp thêm thông tin về sự kiện.",
    
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
    
    
    // Registration form specific translations (camelCase)
    information_fields: "trường thông tin",
    member_list: "Danh sách thành viên",
    document_not_available: "Tài liệu chưa có sẵn",
    no_events_created_yet: "Hiện tại chưa có sự kiện nào được tạo.",
    switched_to_personal_qr_no_group: "Đã chuyển về QR cá nhân vì bạn chưa có nhóm",
    no_group_id_contact_organizers: "Chưa có Group ID • Liên hệ ban tổ chức",
    no_time_available: "Chưa có thời gian",
    no_matching_exhibitors_found: "Không tìm thấy nhà triễn lãm phù hợp",
    no_exhibitor_information_available: "Chưa có thông tin nhà triễn lãm",
    no_favorite_exhibitors: "Chưa có nhà triễn lãm yêu thích",
    no_matching_created: "Chưa có kết nối nào được tạo",
    
    // Core UI Elements (camelCase)
    phone_number: "Số Điện Thoại",
    name: "Tên",
    email: "Email",
    company: "Công Ty",
    group_id: "Mã Nhóm",
    your_information: "Thông tin của bạn",
    exhibition_map: "Sơ đồ triển lãm",
    active: "Hoạt động",
    search_exhibitors_booths_products: "Tìm kiếm nhà triễn lãm, gian hàng, sản phẩm...",
    categories: "Danh mục",
    tap_to_filter_by_categories: "Nhấn để lọc theo danh mục",
    selected: "đã chọn",
    searching: "Đang tìm kiếm...",
    results: "kết quả",
    categories_singular: "danh mục",
    select_categories: "Chọn danh mục",
    select_categories_to_filter_exhibitors: "Chọn danh mục để lọc nhà triễn lãm",
    all: "Tất cả",
    favorites: "Yêu thích",
    add: "Thêm",
    exhibitors: "Exhibitors",
    all_exhibitors: "Tất cả Exhibitors",
    booth: "Booth",
    exhibitor: "Exhibitor",
    exhibitor_id: "Exhibitor ID",
    add_to_calendar: "Thêm vào lịch",
    tap_to_view: "Nhấn để xem",
    exhibitors_vi: "Nhà triễn lãm",
    of: "của",
    clear_all: "Xóa tất cả",
    apply_filters: "Áp dụng bộ lọc",
    time_of_day: "Thời gian trong ngày",
    all_times: "Tất cả thời gian",
    morning: "Sáng",
    afternoon: "Chiều",
    evening: "Tối",
    status: "Trạng thái",
    all_status: "Tất cả trạng thái",
    matching_singular: "matching",
    
    // Error Messages (camelCase)
    unable_to_load_event_info: "Không thể tải thông tin sự kiện. Vui lòng thử lại.",
    an_error_occurred: "Có lỗi xảy ra. Vui lòng thử lại.",
    unable_to_load_event_list: "Không thể tải danh sách sự kiện. Vui lòng thử lại.",
    page_not_found: "Trang không tồn tại",
    
    // Ticket page translations
    member_check_title: "Kiểm tra thành viên",
    buy_ticket_title: "Mua vé",
    member_check_subtitle: "Xác minh thông tin thành viên",
    buy_ticket_subtitle: "Hoàn tất mua vé cho sự kiện",
    member_check_section: "Bạn là hội viên của hiệp hội",
    member_check_description: "Vui lòng xác minh thông tin thành viên của bạn.",
    buy_ticket_section: "Thông tin mua vé",
    buy_ticket_description: "Vui lòng cung cấp thông tin để hoàn tất mua vé.",
    otp_label: "OTP",
    otp_placeholder: "Nhập mã OTP",
    resend_otp: "Không nhận được OTP? Click để gửi lại.",
    verify_member: "Xác minh thành viên",
    event_id: "Mã sự kiện",
    registration_id: "Mã đăng ký",
    ticket_type: "Loại vé",
    select_ticket_type: "Chọn loại vé",
    standard_ticket: "Vé tiêu chuẩn",
    vip_ticket: "Vé VIP",
    premium_ticket: "Vé Premium",
    complete_purchase: "Hoàn tất mua vé",
    ticket_form_footer: "Form này được tạo tự động dựa trên thông tin đăng ký của bạn.",
    form_not_available: "Form không khả dụng",
    invalid_member_status: "Trạng thái thành viên không hợp lệ.",
    please_wait: "Vui lòng chờ trong giây lát...",
    form_footer_note: "Cuộn xuống để xem toàn bộ form và bấm nút submit",
    page_not_found_description: "Trang bạn đang tìm kiếm không tồn tại. Vui lòng chọn một sự kiện bên dưới.",
    unable_to_initialize_camera: "Không thể khởi tạo camera. Vui lòng sử dụng manual input.",
    please_contact_organizers_for_details: "Vui lòng liên hệ ban tổ chức để biết thêm chi tiết",
    unable_to_load_document: "Không thể tải tài liệu",
    document_may_need_to_be_downloaded: "Tài liệu có thể cần được download",
    
    // Form Validation (camelCase)
    please_select_salutation: "Vui lòng chọn xưng hô.",
    please_enter_full_name: "Vui lòng nhập họ và tên.",
    please_enter_email: "Vui lòng nhập email.",
    please_enter_valid_email: "Vui lòng nhập email hợp lệ.",
    please_enter_phone_number: "Vui lòng nhập số điện thoại.",
    please_enter_valid_phone_number: "Vui lòng nhập số điện thoại hợp lệ.",
    please_select_an_option: "Vui lòng chọn một tùy chọn.",
    please_select_file: "Vui lòng chọn file.",
    
    // Member Management (camelCase)
    member_phone: "SĐT thành viên",
    member_number: "Thành viên #",
    
    // QR Code Instructions (camelCase)
    use_group_qr_to_checkin_all_members_at_once: "Sử dụng QR nhóm để check-in tất cả thành viên cùng lúc",
    each_member_can_use_personal_qr_to_checkin_individually: "Mỗi thành viên có thể sử dụng QR cá nhân để check-in riêng lẻ",
    save_or_print_page_to_easily_access_qr_codes_at_event: "Lưu hoặc in trang này để dễ dàng truy cập QR codes tại sự kiện",
    present_qr_code_at_registration_desk_to_checkin_to_event: "Trình QR code này tại quầy đăng ký để check-in vào sự kiện",
    
    // Import & Export (camelCase)
    please_fix_errors_before_import: "Vui lòng sửa các lỗi trong file trước khi import.",
    error_exporting_error_report: "Có lỗi khi xuất file báo cáo lỗi.",
    please_upload_file_to_preview: "Vui lòng tải file để xem trước.",
    
    // QR Code related keys (camelCase)
    badge_qr_code: "Mã QR Thẻ Đeo",
    redeem_qr_code_to_reprint_badge: "Redeem QR Code (để in lại thẻ)",
    qr_checkin_personal: "QR Check-in (Cá nhân)",
    qr_checkin_group: "QR Check-in (Nhóm)",
    generating: "Generating",
    error: "Error",
    no_qr: "No QR",
    checkin_entire_group: "Check-in toàn nhóm",
    
    // About Nexpo
    about_nexpo: "Về Nexpo",
    about_nexpo_title: "Nexpo – Giải pháp toàn diện cho Sự kiện & Triển lãm",
    about_nexpo_description: "Nexpo là nền tảng toàn diện cho việc quản lý sự kiện và triển lãm – giúp ban tổ chức và người tham dự kết nối dễ dàng, sử dụng công cụ thông minh và tận hưởng trải nghiệm sự kiện hiệu quả, liền mạch.",
    about_nexpo_support: "Hỗ trợ: contact@nexpo.vn",
    about_nexpo_website: "Website chính thức: https://nexpo.vn",
    about_nexpo_address: "Địa chỉ: Tầng 5 – Tòa nhà Ngọc Linh Nhi, 97 Trần Quang Diệu, Phường 14, Quận 3, TP.HCM",
    about_nexpo_hotline: "Hotline: 028.6682.7794",
    visit_website: "Truy cập Website",
    contact_us: "Liên hệ",
    translating_content: "Đang dịch...",
    language_vietnamese: "Tiếng Việt",
    language_english: "English"
  },

  en: {
    // Core field labels
    Salutation: "Salutation",
    Full_Name: "Full Name",
    Phone_Number: "Phone Number",
    
 
    
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
    auto_redirect: "Auto redirect to access code page in",
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
    
    // Common field values
    
    // Registration form specific translations (camelCase)
    information_fields: "information fields",
    member_list: "Member List",
    document_not_available: "Document not available",
    no_events_created_yet: "No events have been created yet.",
    switched_to_personal_qr_no_group: "Switched to personal QR because you don't have a group",
    no_group_id_contact_organizers: "No Group ID • Contact organizers",
    no_time_available: "No time available",
    no_matching_exhibitors_found: "No matching exhibitors found",
    no_exhibitor_information_available: "No exhibitor information available",
    no_favorite_exhibitors: "No favorite exhibitors",
    no_matching_created: "No matching has been created",
    member_phone: "Member Phone",
    use_group_qr_to_checkin_all_members_at_once: "Use group QR to check-in all members at once",
    each_member_can_use_personal_qr_to_checkin_individually: "Each member can use personal QR to check-in individually",
    member_number: "Member #",
    add_new_member: "Add New Member",
    edit_member: "Edit Member",
    fill_information_for_new_member: "Fill information for new member",
    update_member_information: "Update member information",
    save_changes: "Save Changes",
    basic_information: "Basic Information",
    additional_information: "Additional Information",
    save_or_print_page_to_easily_access_qr_codes_at_event: "Save or print this page to easily access QR codes at the event",
    present_qr_code_at_registration_desk_to_checkin_to_event: "Present this QR code at the registration desk to check in to the event",
    loading_information: "Loading information...",
    loading_event_information: "Loading event information...",
    
    // Error messages (camelCase)
    unable_to_connect_to_server: "Unable to connect to server. Please check network connection.",
    unable_to_print_automatically: "Unable to print automatically. Please press Ctrl+P to print manually.",
    unable_to_load_data: "Unable to load data. Please try again.",
    unable_to_copy_qr_data: "Unable to copy QR data",
    unable_to_load_information: "Unable to load information",
    an_error_occurred_general: "An error occurred",
    error_creating_pdf: "Error creating PDF. Please try again.",
    error_sending_matching_request: "Error sending matching request",
    error_during_checkin: "Error occurred during check-in. Please try again.",
    
    // Not found messages (camelCase)
    event_not_found_with_period: "Event not found.",
    registration_information_not_found: "Registration information not found.",
    visitor_information_not_found: "Visitor information not found.",
    visitor_with_id_not_found: "Visitor with this ID not found. Please check the QR code or ID.",
    no_matching_found: "No matching found",
    
    // Page messages (camelCase)
    back_to_main_page_after: "Back to main page after",
    auto_scan_next_after: "Auto scan next after",
    auto_redirect_to_access_code_page_after: "Auto redirect to access code page after",
    
    // Form validation messages (camelCase)
    please_select_an_option: "Please select an option.",
    please_select_file: "Please select a file.",
    please_fix_errors_before_import: "Please fix errors in the file before importing.",
    please_upload_file_to_preview: "Please upload the file to preview.",
    please_fill_in_all_information: "Please fill in all information",
    please_select_date_and_time: "Please select date and time",
    please_check_access_code_from_organizers: "Please check the access code from the organizers.",
    please_come_back_later_for_details: "Please come back later to see detailed information",
    please_contact_organizers_reception: "Please contact the organizers' reception department.",
    please_enter_visitor_id: "Please enter visitor ID.",
    system_error_try_again_later: "System error. Please try again later.",
    please_contact_organizers_for_details: "Please contact the organizers for more details",
    
    // Import page messages (camelCase)
    click_error_cell_to_edit_directly: "Click on the error cell to edit directly",
    no_error_rows_to_export: "No error rows to export.",
    and_other_errors_see_table_below: "and other errors. Please see the table below to fix all errors.",
    
    // Check-in messages (camelCase)
    camera_access_denied_use_manual_input: "Camera access denied. You can still use manual input.",
    visitor_id_must_have_at_least_3_characters: "Visitor ID must have at least 3 characters.",
    visitor_does_not_belong_to_this_event: "Visitor does not belong to this event.",
    please_check_qr_code_or_visitor_id_again: "Please check the QR code or visitor ID again.",
    popup_blocked_print_in_current_window: "Popup blocked. Do you want to print in the current window?",
    this_event_does_not_support_badge_printing: "This event does not support badge printing",
    event_does_not_exist_or_ended: "Event does not exist or has ended",
    
    // Insight page messages (camelCase)
    no_description: "No description",
    do_not_share_code_with_others: "Do not share this code with others.",
    invalid_access_code: "Invalid access code",
    visitor_id_does_not_exist_or_invalid: "Visitor ID does not exist or is invalid.",
    no_matching_suitable_for_current_filter: "No matching suitable for current filter",
    are_you_sure_delete_all_favorite_exhibitors: "Are you sure you want to delete all favorite exhibitors?",
    rating_very_interested_interested_may_cooperate: "Rating: Very interested Interested May cooperate",
    wish_you_successful_exhibition_visit: "Wish you a successful exhibition visit!",
    
    // File viewer messages (camelCase)
    document_may_need_to_be_downloaded: "Document may need to be downloaded",
    
    // Exhibitor modal messages (camelCase)
    no_other_media: "No other media",
    
    // Insight page additional messages (camelCase)
    exhibitor_singular: "exhibitor",
    exhibitor_label: "Exhibitor",
    category: "Category",
    tap_to_filter_by_category: "Tap to Filter by Category",
    category_singular: "category",
    select_category: "Select Category",
    
    // Core UI Elements (camelCase)
    phone_number: "Phone",
    name: "Name",
    company: "Company",
    group_id: "Group ID",
    your_information: "Your Information",
    exhibition_map: "Exhibition Map",
    active: "Active",
    search_exhibitors_booths_products: "Search exhibitors, booths, products...",
    categories: "Categories",
    tap_to_filter_by_categories: "Tap to filter by categories",
    selected: "selected",
    searching: "Searching...",
    results: "results",
    categories_singular: "categories",
    select_categories: "Select Categories",
    select_categories_to_filter_exhibitors: "Select categories to filter exhibitors",
    all: "All",
    favorites: "Favorites",
    add: "Add",
    exhibitors: "Exhibitors",
    exhibitor_id: "Exhibitor ID",
    add_to_calendar: "Add to Calendar",
    tap_to_view: "Tap to View",
    exhibitors_vi: "Exhibitors",
    of: "of",
    clear_all: "Clear All",
    apply_filters: "Apply Filters",
    time_of_day: "Time of Day",
    all_times: "All Times",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    status: "Status",
    all_status: "All Status",
    matching_singular: "matching",
    
    // About Nexpo
    about_nexpo: "About Nexpo",
    about_nexpo_title: "Nexpo – Comprehensive Event & Exhibition Solution",
    about_nexpo_description: "Nexpo is a comprehensive platform for event and exhibition management – empowering organizers and participants with seamless interaction, smart tools, and a connected event experience.",
    about_nexpo_support: "Support: contact@nexpo.vn",
    about_nexpo_website: "Official Website: https://nexpo.vn",
    about_nexpo_address: "Address: 5th Floor - Ngoc Linh Nhi Building, 97 Tran Quang Dieu, Ward 14, District 3, HCMC",
    about_nexpo_hotline: "Hotline: 028.6682.7794",
    visit_website: "Visit Website",
    contact_us: "Contact Us",
    translating_content: "Translating...",
    language_vietnamese: "Vietnamese",
    language_english: "English",
    
    // QR Code related keys (camelCase)
    badge_qr_code: "Badge QR Code",
    redeem_qr_code_to_reprint_badge: "Redeem QR Code (to reprint badge)",
    qr_checkin_personal: "QR Check-in (Personal)",
    qr_checkin_group: "QR Check-in (Group)",
    generating: "Generating",
    error: "Error",
    no_qr: "No QR",
    checkin_entire_group: "Check-in entire group"
  },
};
