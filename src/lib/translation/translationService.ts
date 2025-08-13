import { EventData, FormField } from '@/lib/api/events';

export interface TranslationConfig {
  defaultLanguage: string;
  supportedLanguages: string[];
  googleTranslateApiKey?: string;
  customTranslationsPath: string;
}

export interface TranslationCache {
  [key: string]: {
    text: string;
    timestamp: number;
  };
}

export interface CustomTranslation {
  [key: string]: {
    [lang: string]: string;
  };
}

class TranslationService {
  private config: TranslationConfig;
  private cache: TranslationCache = {};
  private customTranslations: CustomTranslation = {};
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  constructor(config: TranslationConfig) {
    this.config = config;
    this.loadCustomTranslations();
  }

  // Load custom translations from JSON file
  private async loadCustomTranslations() {
    try {
      const response = await fetch('/api/translations/custom');
      if (response.ok) {
        this.customTranslations = await response.json();
      }
    } catch (error) {
      console.warn('Failed to load custom translations:', error);
    }
  }

  // Save custom translations to JSON file
  private async saveCustomTranslations() {
    try {
      await fetch('/api/translations/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.customTranslations),
      });
    } catch (error) {
      console.error('Failed to save custom translations:', error);
    }
  }

  // Generate cache key for text
  private generateCacheKey(text: string, targetLang: string): string {
    return `${text.toLowerCase().trim()}_${targetLang}`;
  }

  // Check if translation is cached and not expired
  private isCached(text: string, targetLang: string): boolean {
    const key = this.generateCacheKey(text, targetLang);
    const cached = this.cache[key];
    return cached && (Date.now() - cached.timestamp) < this.cacheExpiry;
  }

  // Get cached translation
  private getCachedTranslation(text: string, targetLang: string): string | null {
    const key = this.generateCacheKey(text, targetLang);
    return this.cache[key]?.text || null;
  }

  // Cache translation
  private cacheTranslation(text: string, targetLang: string, translatedText: string) {
    const key = this.generateCacheKey(text, targetLang);
    this.cache[key] = {
      text: translatedText,
      timestamp: Date.now(),
    };
  }

  // Check for custom translation
  private getCustomTranslation(text: string, targetLang: string): string | null {
    const normalizedText = text.toLowerCase().trim();
    return this.customTranslations[normalizedText]?.[targetLang] || null;
  }

  // Add custom translation
  public addCustomTranslation(originalText: string, targetLang: string, translatedText: string) {
    const normalizedText = originalText.toLowerCase().trim();
    if (!this.customTranslations[normalizedText]) {
      this.customTranslations[normalizedText] = {};
    }
    this.customTranslations[normalizedText][targetLang] = translatedText;
    this.saveCustomTranslations();
  }

  // Translate using Google Translate API
  private async translateWithGoogle(text: string, targetLang: string): Promise<string> {
    if (!this.config.googleTranslateApiKey) {
      console.warn('Google Translate API key not configured, using fallback translation');
      return this.fallbackTranslation(text, targetLang);
    }

    const requestBody = {
      q: text,
      source: 'vi',
      target: targetLang,
      format: 'text'
    };

    console.log('📤 Google Translate API Request:', {
      url: `https://translation.googleapis.com/language/translate/v2?key=${this.config.googleTranslateApiKey.substring(0, 10)}...`,
      body: requestBody
    });

    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.config.googleTranslateApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Google Translate API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Translate API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return this.fallbackTranslation(text, targetLang);
      }

      const data = await response.json();
      console.log('📥 Google Translate API Response Data:', data);
      
      // Check if response has the expected structure
      if (data && data.data && data.data.translations && data.data.translations.length > 0) {
        const translatedText = data.data.translations[0].translatedText;
        console.log('✅ Google Translate success - translated text:', translatedText);
        return translatedText;
      } else {
        console.error('❌ Unexpected Google Translate API response structure:', data);
        return this.fallbackTranslation(text, targetLang);
      }
    } catch (error) {
      console.error('❌ Google Translate API error:', error);
      return this.fallbackTranslation(text, targetLang);
    }
  }

  // Fallback translation when API is not available
  private fallbackTranslation(text: string, targetLang: string): string {
    console.log('🔄 fallbackTranslation() called:', { text, targetLang });
    
    // Simple fallback translations for common phrases
    const fallbackTranslations: { [key: string]: { [key: string]: string } } = {
      'en': {
        'đăng ký': 'register',
        'họ và tên': 'full name',
        'email': 'email',
        'số điện thoại': 'phone number',
        'công ty': 'company',
        'chức vụ': 'position',
        'website': 'website',
        'mục đích tham quan': 'visit purpose',
        'kết nối giao thương': 'business networking',
        'tham quan thông thường': 'general visit',
        'tôi đồng ý': 'i agree',
        'bắt buộc': 'required',
        'tùy chọn': 'optional',
        'chính sách bảo mật': 'privacy policy',
        'điều khoản': 'terms',
        'đồng ý nhận thông tin': 'agree to receive information',
        'triển lãm': 'exhibition',
        'tự động hóa': 'automation',
        'công nghiệp': 'industrial',
        'việt nam': 'vietnam',
        'cảm biến': 'sensors',
        'plc': 'plc',
        'dcs': 'dcs',
        'điều khiển chuyển động': 'motion control',
        'máy tính công nghiệp': 'industrial computers',
        'biến tần': 'inverters',
        'hệ thống tự động hóa công nghiệp': 'industrial automation systems',
        'các linh kiện tự động hóa': 'automation components',
        'máy quay công nghiệp': 'industrial cameras',
        'ống kính và đèn chiếu sáng': 'lenses and lighting',
        'phần mềm xử lý hình ảnh': 'image processing software',
        'nhà máy số hóa': 'digital factory',
        'big data': 'big data',
        'ai': 'ai',
        'máy tính đám mây': 'cloud computing',
        'giải pháp nhà máy thông minh': 'smart factory solutions',
        'robots công nghiệp': 'industrial robots',
        'iiot': 'iiot',
        'logistics thông minh': 'smart logistics',
        'agv/amr': 'agv/amr',
        'as/rs': 'as/rs',
        'hệ thống thu thập': 'collection systems',
        'xe nâng': 'forklifts',
        'băng chuyền': 'conveyors',
        'giải pháp logistics': 'logistics solutions',
        'thiết bị an toàn': 'safety equipment',
        'hệ thống quản lý an toàn': 'safety management systems',
        'các công nghệ an toàn': 'safety technologies',
        'dụng cụ an toàn hóa chất': 'chemical safety equipment',
        'chữa cháy': 'fire fighting',
        'cứu hộ': 'rescue',
        'tư vấn mua hàng': 'purchase consultation',
        'tìm nhà cung cấp': 'find suppliers',
        'gặp gỡ đối tác': 'meet partners',
        'tìm kiếm đối tác mới': 'find new partners',
        'tìm hiểu về thị trường': 'learn about the market',
        'tìm hiểu để tham gia lần sau': 'learn to participate next time',
        'tham khảo': 'reference',
        'tham gia sự kiện cùng diễn ra': 'participate in concurrent events',
        'được giới thiệu từ các nhà triển lãm khác': 'introduced by other exhibitors',
        'tin tức / thời sự': 'news / current events',
        'được các hiệp hội giới thiệu': 'introduced by associations',
        'xuất khẩu nhập khẩu': 'import export',
        'sản xuất': 'manufacturing',
        'phân phối': 'distribution',
        'dịch vụ': 'services',
        'khác': 'other',
        'loại hình doanh nghiệp': 'business type',
      },
      'zh': {
        'đăng ký': '注册',
        'họ và tên': '姓名',
        'email': '邮箱',
        'số điện thoại': '电话号码',
        'công ty': '公司',
        'chức vụ': '职位',
        'website': '网站',
        'mục đích tham quan': '参观目的',
        'kết nối giao thương': '商务交流',
        'tham quan thông thường': '一般参观',
        'tôi đồng ý': '我同意',
        'bắt buộc': '必填',
        'tùy chọn': '可选',
        'chính sách bảo mật': '隐私政策',
        'điều khoản': '条款',
        'đồng ý nhận thông tin': '同意接收信息',
        'triển lãm': '展览',
        'tự động hóa': '自动化',
        'công nghiệp': '工业',
        'việt nam': '越南',
        'cảm biến': '传感器',
        'plc': 'plc',
        'dcs': 'dcs',
        'điều khiển chuyển động': '运动控制',
        'máy tính công nghiệp': '工业计算机',
        'biến tần': '变频器',
        'hệ thống tự động hóa công nghiệp': '工业自动化系统',
        'các linh kiện tự động hóa': '自动化组件',
        'máy quay công nghiệp': '工业相机',
        'ống kính và đèn chiếu sáng': '镜头和照明',
        'phần mềm xử lý hình ảnh': '图像处理软件',
        'nhà máy số hóa': '数字化工厂',
        'big data': '大数据',
        'ai': '人工智能',
        'máy tính đám mây': '云计算',
        'giải pháp nhà máy thông minh': '智能工厂解决方案',
        'robots công nghiệp': '工业机器人',
        'iiot': '工业物联网',
        'logistics thông minh': '智能物流',
        'agv/amr': 'agv/amr',
        'as/rs': 'as/rs',
        'hệ thống thu thập': '收集系统',
        'xe nâng': '叉车',
        'băng chuyền': '输送机',
        'giải pháp logistics': '物流解决方案',
        'thiết bị an toàn': '安全设备',
        'hệ thống quản lý an toàn': '安全管理系统',
        'các công nghệ an toàn': '安全技术',
        'dụng cụ an toàn hóa chất': '化学品安全设备',
        'chữa cháy': '消防',
        'cứu hộ': '救援',
        'tư vấn mua hàng': '采购咨询',
        'tìm nhà cung cấp': '寻找供应商',
        'gặp gỡ đối tác': '会见合作伙伴',
        'tìm kiếm đối tác mới': '寻找新合作伙伴',
        'tìm hiểu về thị trường': '了解市场',
        'tìm hiểu để tham gia lần sau': '了解下次参与',
        'tham khảo': '参考',
        'tham gia sự kiện cùng diễn ra': '参加同期活动',
        'được giới thiệu từ các nhà triển lãm khác': '由其他参展商介绍',
        'tin tức / thời sự': '新闻/时事',
        'được các hiệp hội giới thiệu': '由协会介绍',
        'xuất khẩu nhập khẩu': '进出口',
        'sản xuất': '制造',
        'phân phối': '分销',
        'dịch vụ': '服务',
        'khác': '其他',
        'loại hình doanh nghiệp': '企业类型',
      },
      'ja': {
        'đăng ký': '登録',
        'họ và tên': '氏名',
        'email': 'メールアドレス',
        'số điện thoại': '電話番号',
        'công ty': '会社',
        'chức vụ': '役職',
        'website': 'ウェブサイト',
        'mục đích tham quan': '訪問目的',
        'kết nối giao thương': 'ビジネスネットワーキング',
        'tham quan thông thường': '一般見学',
        'tôi đồng ý': '同意します',
        'bắt buộc': '必須',
        'tùy chọn': '任意',
        'chính sách bảo mật': 'プライバシーポリシー',
        'điều khoản': '利用規約',
        'đồng ý nhận thông tin': '情報受信に同意',
        'triển lãm': '展示会',
        'tự động hóa': '自動化',
        'công nghiệp': '産業',
        'việt nam': 'ベトナム',
        'cảm biến': 'センサー',
        'plc': 'plc',
        'dcs': 'dcs',
        'điều khiển chuyển động': 'モーション制御',
        'máy tính công nghiệp': '産業用コンピュータ',
        'biến tần': 'インバーター',
        'hệ thống tự động hóa công nghiệp': '産業用自動化システム',
        'các linh kiện tự động hóa': '自動化コンポーネント',
        'máy quay công nghiệp': '産業用カメラ',
        'ống kính và đèn chiếu sáng': 'レンズと照明',
        'phần mềm xử lý hình ảnh': '画像処理ソフトウェア',
        'nhà máy số hóa': 'デジタルファクトリー',
        'big data': 'ビッグデータ',
        'ai': 'ai',
        'máy tính đám mây': 'クラウドコンピューティング',
        'giải pháp nhà máy thông minh': 'スマートファクトリーソリューション',
        'robots công nghiệp': '産業用ロボット',
        'iiot': 'iiot',
        'logistics thông minh': 'スマートロジスティクス',
        'agv/amr': 'agv/amr',
        'as/rs': 'as/rs',
        'hệ thống thu thập': '収集システム',
        'xe nâng': 'フォークリフト',
        'băng chuyền': 'コンベヤー',
        'giải pháp logistics': 'ロジスティクスソリューション',
        'thiết bị an toàn': '安全機器',
        'hệ thống quản lý an toàn': '安全管理システム',
        'các công nghệ an toàn': '安全技術',
        'dụng cụ an toàn hóa chất': '化学安全機器',
        'chữa cháy': '消火',
        'cứu hộ': '救助',
        'tư vấn mua hàng': '購入相談',
        'tìm nhà cung cấp': 'サプライヤー探し',
        'gặp gỡ đối tác': 'パートナーとの面会',
        'tìm kiếm đối tác mới': '新しいパートナー探し',
        'tìm hiểu về thị trường': '市場について学ぶ',
        'tìm hiểu để tham gia lần sau': '次回参加のための学習',
        'tham khảo': '参考',
        'tham gia sự kiện cùng diễn ra': '同時開催イベントへの参加',
        'được giới thiệu từ các nhà triển lãm khác': '他の出展者からの紹介',
        'tin tức / thời sự': 'ニュース/時事',
        'được các hiệp hội giới thiệu': '協会からの紹介',
        'xuất khẩu nhập khẩu': '輸出入',
        'sản xuất': '製造',
        'phân phối': '流通',
        'dịch vụ': 'サービス',
        'khác': 'その他',
        'loại hình doanh nghiệp': '企業形態',
      },
      'ko': {
        'đăng ký': '등록',
        'họ và tên': '성명',
        'email': '이메일',
        'số điện thoại': '전화번호',
        'công ty': '회사',
        'chức vụ': '직책',
        'website': '웹사이트',
        'mục đích tham quan': '방문 목적',
        'kết nối giao thương': '비즈니스 네트워킹',
        'tham quan thông thường': '일반 견학',
        'tôi đồng ý': '동의합니다',
        'bắt buộc': '필수',
        'tùy chọn': '선택',
        'chính sách bảo mật': '개인정보 보호정책',
        'điều khoản': '이용약관',
        'đồng ý nhận thông tin': '정보 수신 동의',
        'triển lãm': '전시회',
        'tự động hóa': '자동화',
        'công nghiệp': '산업',
        'việt nam': '베트남',
        'cảm biến': '센서',
        'plc': 'plc',
        'dcs': 'dcs',
        'điều khiển chuyển động': '모션 제어',
        'máy tính công nghiệp': '산업용 컴퓨터',
        'biến tần': '인버터',
        'hệ thống tự động hóa công nghiệp': '산업용 자동화 시스템',
        'các linh kiện tự động hóa': '자동화 구성요소',
        'máy quay công nghiệp': '산업용 카메라',
        'ống kính và đèn chiếu sáng': '렌즈 및 조명',
        'phần mềm xử lý hình ảnh': '이미지 처리 소프트웨어',
        'nhà máy số hóa': '디지털 팩토리',
        'big data': '빅데이터',
        'ai': 'ai',
        'máy tính đám mây': '클라우드 컴퓨팅',
        'giải pháp nhà máy thông minh': '스마트 팩토리 솔루션',
        'robots công nghiệp': '산업용 로봇',
        'iiot': 'iiot',
        'logistics thông minh': '스마트 물류',
        'agv/amr': 'agv/amr',
        'as/rs': 'as/rs',
        'hệ thống thu thập': '수집 시스템',
        'xe nâng': '지게차',
        'băng chuyền': '컨베이어',
        'giải pháp logistics': '물류 솔루션',
        'thiết bị an toàn': '안전 장비',
        'hệ thống quản lý an toàn': '안전 관리 시스템',
        'các công nghệ an toàn': '안전 기술',
        'dụng cụ an toàn hóa chất': '화학 안전 장비',
        'chữa cháy': '소방',
        'cứu hộ': '구조',
        'tư vấn mua hàng': '구매 상담',
        'tìm nhà cung cấp': '공급업체 찾기',
        'gặp gỡ đối tác': '파트너 만남',
        'tìm kiếm đối tác mới': '새로운 파트너 찾기',
        'tìm hiểu về thị trường': '시장에 대해 알아보기',
        'tìm hiểu để tham gia lần sau': '다음 참가를 위한 학습',
        'tham khảo': '참고',
        'tham gia sự kiện cùng diễn ra': '동시 진행 이벤트 참가',
        'được giới thiệu từ các nhà triển lãm khác': '다른 전시업체로부터 소개',
        'tin tức / thời sự': '뉴스/시사',
        'được các hiệp hội giới thiệu': '협회로부터 소개',
        'xuất khẩu nhập khẩu': '수출입',
        'sản xuất': '제조',
        'phân phối': '유통',
        'dịch vụ': '서비스',
        'khác': '기타',
        'loại hình doanh nghiệp': '기업 형태',
      },
    };

    const translations = fallbackTranslations[targetLang];
    if (!translations) {
      console.log('❌ No fallback translations available for language:', targetLang);
      return text; // Return original text if no fallback available
    }

    // Try to find a matching translation
    const lowerText = text.toLowerCase();
    console.log('🔍 Looking for matches in:', lowerText);
    
    for (const [vietnamese, translation] of Object.entries(translations)) {
      if (lowerText.includes(vietnamese)) {
        const result = text.replace(new RegExp(vietnamese, 'gi'), translation);
        console.log('✅ Found match:', { vietnamese, translation, result });
        return result;
      }
    }

    console.log('❌ No fallback translation found, returning original text');
    return text; // Return original text if no match found
  }

  // Main translation method
  public async translate(text: string, targetLang: string): Promise<string> {
    console.log('🔍 translate() called:', { text, targetLang, defaultLang: this.config.defaultLanguage });
    
    if (!text || targetLang === this.config.defaultLanguage) {
      console.log('⏭️ Skipping translation - no text or same language');
      return text;
    }

    // Check custom translations first
    const customTranslation = this.getCustomTranslation(text, targetLang);
    if (customTranslation) {
      console.log('✅ Using custom translation:', customTranslation);
      return customTranslation;
    }

    // Check cache
    if (this.isCached(text, targetLang)) {
      const cachedText = this.getCachedTranslation(text, targetLang)!;
      console.log('💾 Using cached translation:', cachedText);
      return cachedText;
    }

    // Try Google Translate first if API key is available
    if (this.config.googleTranslateApiKey) {
      console.log('🌐 Attempting Google Translate...');
      try {
        const translatedText = await this.translateWithGoogle(text, targetLang);
        console.log('✅ Google Translate success:', translatedText);
        this.cacheTranslation(text, targetLang, translatedText);
        return translatedText;
      } catch (error) {
        console.error('❌ Google Translate failed, using fallback:', error);
      }
    } else {
      console.log('⚠️ No Google Translate API key, using fallback');
    }

    // Use fallback translation
    const translatedText = this.fallbackTranslation(text, targetLang);
    console.log('🔄 Using fallback translation:', translatedText);
    this.cacheTranslation(text, targetLang, translatedText);
    return translatedText;
  }

  // Batch translate multiple texts
  public async translateBatch(texts: string[], targetLang: string): Promise<string[]> {
    const results: string[] = [];
    
    for (const text of texts) {
      try {
        const translated = await this.translate(text, targetLang);
        results.push(translated);
      } catch (error) {
        console.error(`Failed to translate: ${text}`, error);
        results.push(text);
      }
    }
    
    return results;
  }

  // Auto-translate event data
  public async translateEventData(eventData: EventData, targetLang: string): Promise<EventData> {
    console.log('🚀 translateEventData() called:', { 
      eventName: eventData.name, 
      targetLang, 
      fieldCount: eventData.formFields?.length || 0 
    });
    
    const translatedEvent = { ...eventData };

    // Translate event name
    if (eventData.name) {
      console.log('📝 Translating event name:', eventData.name);
      translatedEvent.name = await this.translate(eventData.name, targetLang);
      console.log('✅ Event name translated:', translatedEvent.name);
    }

    // Translate event description
    if (eventData.description) {
      console.log('📝 Translating event description...');
      console.log('📝 Original description:', eventData.description.substring(0, 200));
      
      // Use the HTML content translation method directly
      translatedEvent.description = await this.translateHtmlContent(eventData.description, targetLang);
      console.log('✅ Event description translated:', translatedEvent.description.substring(0, 200));
    }

    // Translate form fields
    if (eventData.formFields) {
      console.log('📝 Translating form fields...');
      translatedEvent.formFields = await Promise.all(
        eventData.formFields.map(async (field, index) => {
          console.log(`📋 Translating field ${index + 1}/${eventData.formFields!.length}:`, field.label);
          const translatedField = await this.translateFormField(field, targetLang);
          console.log(`✅ Field ${index + 1} translated:`, translatedField.label);
          return translatedField;
        })
      );
      console.log('✅ All form fields translated');
    }

    console.log('🎉 Event data translation completed');
    return translatedEvent;
  }

  // Extract text content from HTML
  private extractTextFromHTML(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Replace text content in HTML while preserving structure
  private replaceTextInHTML(html: string, originalText: string, translatedText: string): string {
    console.log('🔄 replaceTextInHTML called:', { 
      originalText: originalText.substring(0, 100), 
      translatedText: translatedText.substring(0, 100),
      htmlPreview: html.substring(0, 100)
    });
    
    // Use the translateHtmlContent method instead for better HTML handling
    return this.translateHtmlContentSync(html, originalText, translatedText);
  }

  // Synchronous version of HTML content translation for simple replacement
  private translateHtmlContentSync(html: string, originalText: string, translatedText: string): string {
    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Get all text nodes and replace the original text
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes(originalText)) {
          node.textContent = node.textContent.replace(originalText, translatedText);
        }
      }
      
      const result = tempDiv.innerHTML;
      console.log('✅ HTML replacement completed:', result.substring(0, 100));
      return result;
      
    } catch (error) {
      console.error('❌ Error in translateHtmlContentSync:', error);
      // Fallback to simple string replacement
      const result = html.replace(originalText, translatedText);
      console.log('🔄 Using fallback string replacement:', result.substring(0, 100));
      return result;
    }
  }

  // Translate HTML content, preserving structure
  private async translateHtmlContent(html: string, targetLang: string): Promise<string> {
    if (!html) return html;
    
    console.log('🔄 translateHtmlContent() called:', { html: html.substring(0, 100), targetLang });
    
    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Get all text nodes and translate them
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.trim()) {
          textNodes.push(node as Text);
        }
      }
      
      console.log('📝 Found text nodes:', textNodes.length);
      
      // Translate each text node
      for (const textNode of textNodes) {
        const originalText = textNode.textContent || '';
        if (originalText.trim()) {
          console.log('🔄 Translating text node:', originalText);
          const translatedText = await this.translate(originalText.trim(), targetLang);
          console.log('✅ Translated to:', translatedText);
          textNode.textContent = translatedText;
        }
      }
      
      const result = tempDiv.innerHTML;
      console.log('🎉 HTML translation completed:', result.substring(0, 100));
      return result;
      
    } catch (error) {
      console.error('❌ Error in translateHtmlContent:', error);
    }
    
    console.log('⚠️ Returning original HTML');
    return html;
  }

  // Translate form field using translation object if available
  private async translateFormField(field: FormField, targetLang: string): Promise<FormField> {
    console.log(`📋 Translating field: ${field.label} (${field.type})`);
    
    const translatedField = { ...field };
    
    // Check if field has translation object
    if (field.translation) {
      console.log('🔍 Field has translation object, checking for existing translations...');
      
      // Map target language to translation object keys
      const translationKeyMap: { [key: string]: string } = {
        'en': 'en_',
        'zh': 'zh_',
        'ja': 'ja_',
        'ko': 'ko_'
      };
      
      const prefix = translationKeyMap[targetLang];
      if (prefix) {
        // Translate label
        const labelKey = `${prefix}label` as keyof typeof field.translation;
        if (field.translation[labelKey]) {
          translatedField.label = field.translation[labelKey] as string;
          console.log(`✅ Using existing translation for label: ${translatedField.label}`);
        } else {
          console.log('🔄 No existing translation for label, using Google Translate');
          translatedField.label = await this.translate(field.label, targetLang);
        }
        
        // Translate help text
        const helptextKey = `${prefix}helptext` as keyof typeof field.translation;
        if (field.translation[helptextKey]) {
          translatedField.helptext = field.translation[helptextKey] as string;
          console.log(`✅ Using existing translation for helptext: ${translatedField.helptext}`);
        } else if (field.helptext) {
          console.log('🔄 No existing translation for helptext, using Google Translate');
          translatedField.helptext = await this.translate(field.helptext, targetLang);
        }
        
        // Translate placeholder
        const placeholderKey = `${prefix}placeholder` as keyof typeof field.translation;
        if (field.translation[placeholderKey]) {
          translatedField.placeholder = field.translation[placeholderKey] as string;
          console.log(`✅ Using existing translation for placeholder: ${translatedField.placeholder}`);
        } else if (field.placeholder) {
          console.log('🔄 No existing translation for placeholder, using Google Translate');
          translatedField.placeholder = await this.translate(field.placeholder, targetLang);
        }
        
        // Translate section name
        const sectionnameKey = `${prefix}sectionname` as keyof typeof field.translation;
        if (field.translation[sectionnameKey]) {
          translatedField.section_name = field.translation[sectionnameKey] as string;
          console.log(`✅ Using existing translation for section_name: ${translatedField.section_name}`);
        } else if (field.section_name) {
          console.log('🔄 No existing translation for section_name, using Google Translate');
          translatedField.section_name = await this.translate(field.section_name, targetLang);
        }
        
        // Handle Agreement fields
        if (field.type === 'Agreement') {
          // Translate checkbox label
          const checkboxlabelKey = `${prefix}checkboxlabel` as keyof typeof field.translation;
          if (field.translation[checkboxlabelKey]) {
            translatedField.checkbox_label = field.translation[checkboxlabelKey] as string;
            console.log(`✅ Using existing translation for checkbox_label: ${translatedField.checkbox_label}`);
          } else if (field.checkbox_label) {
            console.log('🔄 No existing translation for checkbox_label, using Google Translate');
            translatedField.checkbox_label = await this.translate(field.checkbox_label, targetLang);
          }
          
          // Translate agreement content
          const agreementcontentKey = `${prefix}agreementcontent` as keyof typeof field.translation;
          if (field.translation[agreementcontentKey]) {
            translatedField.content = field.translation[agreementcontentKey] as string;
            console.log(`✅ Using existing translation for agreement content`);
          } else if (field.content) {
            console.log('🔄 No existing translation for agreement content, using Google Translate');
            translatedField.content = await this.translateHtmlContent(field.content, targetLang);
          }
          
          // Translate agreement title
          const agreementtitleKey = `${prefix}agreementtitle` as keyof typeof field.translation;
          if (field.translation[agreementtitleKey]) {
            translatedField.title = field.translation[agreementtitleKey] as string;
            console.log(`✅ Using existing translation for agreement title: ${translatedField.title}`);
          } else if (field.title) {
            console.log('🔄 No existing translation for agreement title, using Google Translate');
            translatedField.title = await this.translate(field.title, targetLang);
          }
        }
        
        // Handle Select and Multi Select values
        if ((field.type === 'Select' || field.type === 'Multi Select') && field.values && field.values.length > 0) {
          const valueKey = `${prefix}value` as keyof typeof field.translation;
          if (field.translation[valueKey]) {
            // Parse comma-separated values from translation
            const translatedValues = (field.translation[valueKey] as string).split(',').map((v: string) => v.trim());
            console.log(`✅ Using existing translation for values: ${translatedValues.join(', ')}`);
            
            // Convert to {value, label} format if needed
            if (typeof field.values[0] === 'object' && 'value' in field.values[0] && 'label' in field.values[0]) {
              // Already in correct format, update labels
              translatedField.values = field.values.map((option: any, index: number) => ({
                value: option.value,
                label: translatedValues[index] || option.label
              }));
            } else {
              // Convert string array to {value, label} format
              translatedField.values = (field.values as string[]).map((value: string, index: number) => ({
                value: value,
                label: translatedValues[index] || value
              }));
            }
          } else {
            console.log('🔄 No existing translation for values, using Google Translate');
            // Use existing logic for Google Translate
            if (typeof field.values[0] === 'object' && 'value' in field.values[0] && 'label' in field.values[0]) {
              const translatedOptions = await Promise.all(
                field.values.map(async (option: any) => ({
                  value: option.value,
                  label: await this.translate(option.label, targetLang)
                }))
              );
              translatedField.values = translatedOptions;
            } else {
              const translatedOptions = await Promise.all(
                (field.values as string[]).map(async (value: string) => ({
                  value: value,
                  label: await this.translate(value, targetLang)
                }))
              );
              translatedField.values = translatedOptions;
            }
          }
        }
        
        // Handle link text for fields with links
        if (field.link_text) {
          const linktextKey = `${prefix}linktext` as keyof typeof field.translation;
          if (field.translation[linktextKey]) {
            translatedField.link_text = field.translation[linktextKey] as string;
            console.log(`✅ Using existing translation for link_text: ${translatedField.link_text}`);
          } else {
            console.log('🔄 No existing translation for link_text, using Google Translate');
            translatedField.link_text = await this.translate(field.link_text, targetLang);
          }
        }
        
      } else {
        console.log(`⚠️ No translation mapping for language: ${targetLang}, using Google Translate`);
        // Fallback to original translation logic
        return await this.translateFieldWithGoogle(field, targetLang);
      }
    } else {
      console.log('🔄 No translation object found, using Google Translate');
      // Fallback to original translation logic
      return await this.translateFieldWithGoogle(field, targetLang);
    }
    
    console.log(`✅ Field translation completed: ${translatedField.label}`);
    return translatedField;
  }

  // Original field translation logic (renamed for clarity)
  private async translateFieldWithGoogle(field: FormField, targetLang: string): Promise<FormField> {
    console.log(`📋 Translating field with Google: ${field.label}`);
    
    const translatedField = { ...field };

    // Translate field label
    if (field.label) {
      translatedField.label = await this.translate(field.label, targetLang);
    }

    // Translate help text
    if (field.helptext) {
      translatedField.helptext = await this.translate(field.helptext, targetLang);
    }

    // Translate placeholder
    if (field.placeholder) {
      translatedField.placeholder = await this.translate(field.placeholder, targetLang);
    }

    // Translate section name
    if (field.section_name) {
      translatedField.section_name = await this.translate(field.section_name, targetLang);
    }

    // Translate checkbox label for Agreement fields
    if (field.type === 'Agreement' && field.checkbox_label) {
      translatedField.checkbox_label = await this.translate(field.checkbox_label, targetLang);
    }

    // Translate content for Agreement fields
    if (field.type === 'Agreement' && field.content) {
      console.log('🔄 Translating Agreement content with Google Translate');
      translatedField.content = await this.translateHtmlContent(field.content, targetLang);
    }

    // Translate select values
    if (field.values && field.values.length > 0) {
      console.log(`📋 Translating ${field.values.length} values with Google Translate`);
      
      if (typeof field.values[0] === 'object' && 'value' in field.values[0] && 'label' in field.values[0]) {
        const translatedOptions = await Promise.all(
          field.values.map(async (option: any) => ({
            value: option.value,
            label: await this.translate(option.label, targetLang)
          }))
        );
        translatedField.values = translatedOptions;
      } else {
        const translatedOptions = await Promise.all(
          (field.values as string[]).map(async (value: string) => ({
            value: value,
            label: await this.translate(value, targetLang)
          }))
        );
        translatedField.values = translatedOptions;
      }
    }

    return translatedField;
  }

  // Get translation suggestions for improvement
  public getTranslationSuggestions(originalText: string, targetLang: string): string[] {
    const normalizedText = originalText.toLowerCase().trim();
    const suggestions: string[] = [];
    
    // Add common translations for similar texts
    Object.keys(this.customTranslations).forEach(key => {
      if (key.includes(normalizedText) || normalizedText.includes(key)) {
        const translation = this.customTranslations[key][targetLang];
        if (translation && !suggestions.includes(translation)) {
          suggestions.push(translation);
        }
      }
    });
    
    return suggestions;
  }

  // Clear cache
  public clearCache() {
    this.cache = {};
  }

  // Get cache statistics
  public getCacheStats() {
    const totalEntries = Object.keys(this.cache).length;
    const expiredEntries = Object.values(this.cache).filter(
      entry => (Date.now() - entry.timestamp) >= this.cacheExpiry
    ).length;
    
    return {
      totalEntries,
      expiredEntries,
      validEntries: totalEntries - expiredEntries,
    };
  }
}

// Create singleton instance
const translationService = new TranslationService({
  defaultLanguage: 'vi',
  supportedLanguages: ['vi', 'en', 'zh', 'ja', 'ko'],
  googleTranslateApiKey: process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || '',
  customTranslationsPath: '/api/translations/custom',
});

export default translationService; 