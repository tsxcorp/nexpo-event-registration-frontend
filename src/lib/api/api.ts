export interface FormField {
    label: string;
    type: string;
    required: boolean;
    default: string;
    helptext: string;
    values?: string | string[];
    groupmember?: boolean;
    // Translation object for pre-defined translations
    translation?: {
      en_sectionname?: string;
      en_label?: string;
      en_value?: string;
      en_placeholder?: string;
      en_helptext?: string;
      en_agreementcontent?: string;
      en_agreementtitle?: string;
      en_checkboxlabel?: string;
      en_linktext?: string;
      zh_sectionname?: string;
      zh_label?: string;
      zh_value?: string;
      zh_placeholder?: string;
      zh_helptext?: string;
      zh_agreementcontent?: string;
      zh_agreementtitle?: string;
      zh_checkboxlabel?: string;
      zh_linktext?: string;
      ja_sectionname?: string;
      ja_label?: string;
      ja_value?: string;
      ja_placeholder?: string;
      ja_helptext?: string;
      ja_agreementcontent?: string;
      ja_agreementtitle?: string;
      ja_checkboxlabel?: string;
      ja_linktext?: string;
      ko_sectionname?: string;
      ko_label?: string;
      ko_value?: string;
      ko_placeholder?: string;
      ko_helptext?: string;
      ko_agreementcontent?: string;
      ko_agreementtitle?: string;
      ko_checkboxlabel?: string;
      ko_linktext?: string;
    };
  }
  
  export interface EventData {
  id: string;
  name: string;
  description: string;
  banner?: string;
  logo?: string;
  favicon?: string;
  header?: string;
  footer?: string;
  email?: string;
  formFields: FormField[];
}
  
  export const fetchEventInfo = async (eventId: string): Promise<{ event: EventData }> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/events?eventId=${eventId}`);
    if (!res.ok) throw new Error("Failed to fetch event info");
    return res.json();
  };
  