export interface FormField {
    label: string;
    type: string;
    required: boolean;
    default: string;
    helptext: string;
    values?: string[];
  }
  
  export interface EventData {
    id: string;
    name: string;
    description: string;
    banner: string;
    logo: string;
    header: string;
    footer: string;
    email: string;
    formFields: FormField[];
  }
  
  export const fetchEventInfo = async (eventId: string): Promise<{ event: EventData }> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/events?eventId=${eventId}`);
    if (!res.ok) throw new Error("Failed to fetch event info");
    return res.json();
  };
  