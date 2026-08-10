/** Country safety content pending product/legal verification before publication. */
export interface CountrySafetyCandidate {
  /** ISO 3166-1 alpha-2. */
  code: string;
  nameZh: string;
  nameEn: string;
  /** BCP-47 code used by text-to-speech. */
  langCode: string;
  emergency: {
    police: string;
    ambulance: string;
    fire: string;
    touristPolice?: string;
  };
  embassy: string;
  tipping: string;
  voltage: string;
  currency: string;
  water: string;
  scams: string[];
  sos: { local: string; phonetic: string };
}

/** Candidate content must be verified against official sources before release. */
export const COUNTRY_SAFETY_CANDIDATES: CountrySafetyCandidate[] = [
  {
    code: 'CN', nameZh: '中国', nameEn: 'China', langCode: 'zh-CN',
    emergency: { police: '110', ambulance: '120', fire: '119' },
    embassy: '', tipping: '无小费文化', voltage: '220V · A/C/I 型插座', currency: '人民币 CNY',
    water: '自来水不建议直饮，喝烧开的水或瓶装水',
    scams: ['景区门口"低价团"/黄牛票', '火车站/机场"好心人"代购车票骗局'],
    sos: { local: '请帮我报警', phonetic: 'Qing bang wo bao jing' },
  },
  {
    code: 'JP', nameZh: '日本', nameEn: 'Japan', langCode: 'ja-JP',
    emergency: { police: '110', ambulance: '119', fire: '119' },
    embassy: '+81 3 3403 3064', tipping: '无小费文化，切勿留小费', voltage: '100V · A/B 型插座', currency: '日元 JPY',
    water: '自来水可直接饮用', scams: ['居酒屋/黑酒吧结账陷阱（先问清收费）', '歌舞伎町拉客进店高价消费'],
    sos: { local: '助けてください。警察を呼んでください', phonetic: 'Tasukete kudasai. Keisatsu o yonde kudasai' },
  },
  {
    code: 'KR', nameZh: '韩国', nameEn: 'South Korea', langCode: 'ko-KR',
    emergency: { police: '112', ambulance: '119', fire: '119' },
    embassy: '+82 2 755 0572', tipping: '无小费文化', voltage: '220V · C/F 型插座', currency: '韩元 KRW',
    water: '自来水可直饮（部分地区水质偏硬）', scams: ['明洞/梨泰院换汇缺斤少两，数清钞票', '出租车绕路，用 Kakao T 叫车'],
    sos: { local: '도와주세요. 경찰을 불러주세요', phonetic: 'Dowajuseyo. Gyeongchareul bulleojuseyo' },
  },
  {
    code: 'HK', nameZh: '中国香港', nameEn: 'Hong Kong SAR', langCode: 'zh-HK',
    emergency: { police: '999', ambulance: '999', fire: '999' },
    embassy: '外交部驻港公署 +852 2106 6303', tipping: '多数账单已含 10% 服务费，可留零钱', voltage: '220V · G 型插座', currency: '港币 HKD',
    water: '自来水可直接饮用', scams: ['街头"风水大师"看相收费', '"捡钱平分"骗局'],
    sos: { local: '請幫我報警', phonetic: 'Cheng bong ngo bou ging' },
  },
  {
    code: 'MO', nameZh: '中国澳门', nameEn: 'Macao SAR', langCode: 'zh-MO',
    emergency: { police: '999', ambulance: '999', fire: '999' },
    embassy: '外交部驻澳公署 +853 2890 2625', tipping: '多数账单已含服务费，酒店行李可给零钱', voltage: '220V · G 型插座', currency: '澳门元 MOP（港元通用）',
    water: '自来水可直饮（建议瓶装）', scams: ['赌场外"免费筹码/带路"拉客', '街头"低价换汇"骗局'],
    sos: { local: '請幫我報警', phonetic: 'Cheng bong ngo bou ging' },
  },
  {
    code: 'TH', nameZh: '泰国', nameEn: 'Thailand', langCode: 'th-TH',
    emergency: { police: '191', ambulance: '1669', fire: '199', touristPolice: '1155' },
    embassy: '+66 2 245 7010', tipping: '小费非强制，服务好可留零钱或约 10%', voltage: '220V · A/C 型插座', currency: '泰铢 THB',
    water: '自来水不建议直饮，买瓶装水', scams: ['突突车绕路/虚高报价，上车前谈好价', '大皇宫"今天关门"骗局——带你去的不是大皇宫'],
    sos: { local: 'ขอความช่วยเหลือด้วยครับ โปรดเรียกตำรวจ', phonetic: 'Kho khwam chuai luea duay khrap' },
  },
  {
    code: 'VN', nameZh: '越南', nameEn: 'Vietnam', langCode: 'vi-VN',
    emergency: { police: '113', ambulance: '115', fire: '114' },
    embassy: '+84 24 3823 5569', tipping: '非强制，餐厅可留 5-10%', voltage: '220V · A/C 型插座', currency: '越南盾 VND',
    water: '自来水不建议直饮，买瓶装水', scams: ['出租车绕路/调表，用 Grab', '"帮你拿行李"后索要高额小费'],
    sos: { local: 'Xin hãy giúp tôi. Gọi cảnh sát', phonetic: 'Sin hay zup toi. Goi kanh sat' },
  },
  {
    code: 'SG', nameZh: '新加坡', nameEn: 'Singapore', langCode: 'en-SG',
    emergency: { police: '999', ambulance: '995', fire: '995' },
    embassy: '+65 6471 2117', tipping: '多数账单已含 10% 服务费，无需另付', voltage: '230V · G 型插座', currency: '新加坡元 SGD',
    water: '水龙头水可直接饮用', scams: ['罚款极严：地铁饮食/吸烟/乱丢垃圾重罚', '路边"便宜手表/皮具"多为假货'],
    sos: { local: 'Please help me. Call the police', phonetic: 'Please help me. Call the police' },
  },
  {
    code: 'MY', nameZh: '马来西亚', nameEn: 'Malaysia', langCode: 'ms-MY',
    emergency: { police: '999', ambulance: '999', fire: '999' },
    embassy: '+60 3 2164 5301', tipping: '无强制，酒店行李员可给少量小费', voltage: '240V · G 型插座', currency: '林吉特 MYR',
    water: '部分地区自来水不建议直饮', scams: ['出租车不打表漫天要价，用 Grab', '街头"换汇优惠"骗局'],
    sos: { local: 'Tolong bantu saya. Panggil polis', phonetic: 'Tolong bantu saya. Panggil polis' },
  },
  {
    code: 'ID', nameZh: '印度尼西亚', nameEn: 'Indonesia', langCode: 'id-ID',
    emergency: { police: '110', ambulance: '118', fire: '113' },
    embassy: '+62 21 576 1037', tipping: '部分账单含 5-10% 服务费，可再留零钱', voltage: '230V · C/F 型插座', currency: '印尼盾 IDR',
    water: '自来水不建议直饮，买瓶装水', scams: ['换汇店汇率陷阱（先比价）', '包车司机强制带去购物点'],
    sos: { local: 'Tolong bantu saya. Panggil polisi', phonetic: 'Tolong bantu saya. Panggil polisi' },
  },
  {
    code: 'PH', nameZh: '菲律宾', nameEn: 'Philippines', langCode: 'fil-PH',
    emergency: { police: '911', ambulance: '911', fire: '911' },
    embassy: '+63 2 8231 1033', tipping: '常见 5-10%，酒店行李 20-50 比索', voltage: '220V · A/B 型插座', currency: '菲律宾比索 PHP',
    water: '自来水不建议直饮，买瓶装水', scams: ['机场换汇骗局，只去正规柜台', '街头乞丐/孩童纠缠乞讨'],
    sos: { local: 'Tulong po. Tumawag po kayo ng pulis', phonetic: 'Tulong po. Tumawag po kayo ng pulis' },
  },
  {
    code: 'KH', nameZh: '柬埔寨', nameEn: 'Cambodia', langCode: 'km-KH',
    emergency: { police: '119', ambulance: '120', fire: '117' },
    embassy: '+855 12 901 923', tipping: '非强制，服务好可留零钱', voltage: '230V · A/C/G 型插座', currency: '瑞尔 KHR（美元普遍通用）',
    water: '自来水不建议直饮，买瓶装水', scams: ['嘟嘟车绕路，先谈价再上车', '西港"高回报投资"骗局'],
    sos: { local: 'សូមជួយខ្ញុំផង។ ហៅប៉ូលីស', phonetic: 'Som chuoy khnhom pong. Hav polis' },
  },
  {
    code: 'IN', nameZh: '印度', nameEn: 'India', langCode: 'hi-IN',
    emergency: { police: '112', ambulance: '112', fire: '112' },
    embassy: '+91 11 2611 2345', tipping: '5-10%，高档餐厅 10%', voltage: '230V · C/D 型插座', currency: '印度卢比 INR',
    water: '自来水不建议直饮，买瓶装水', scams: ['突突车绕路/虚高报价，用 Uber/Ola', '假"政府旅游办公室"高价卖票'],
    sos: { local: 'कृपया मेरी मदद करें। पुलिस को बुलाएँ', phonetic: 'Kripa karke meri madad karein. Police ko bulayen' },
  },
  {
    code: 'TR', nameZh: '土耳其', nameEn: 'Türkiye', langCode: 'tr-TR',
    emergency: { police: '112', ambulance: '112', fire: '112' },
    embassy: '+90 312 436 0628', tipping: '非强制，餐厅可留 5-10%', voltage: '230V · C/F 型插座', currency: '里拉 TRY',
    water: '自来水不建议直饮，买瓶装水', scams: ['鞋童"掉刷子"骗局', '餐厅无菜单报价，结账翻倍'],
    sos: { local: 'Lütfen bana yardım edin. Polisi arayın', phonetic: 'Lütfen bana yardım edin. Polisi arayın' },
  },
  {
    code: 'AE', nameZh: '阿联酋', nameEn: 'United Arab Emirates', langCode: 'ar-AE',
    emergency: { police: '999', ambulance: '998', fire: '997' },
    embassy: '+971 2 443 4276', tipping: '常见 10-15%，账单多已含服务费', voltage: '230V · G 型插座', currency: '迪拉姆 AED',
    water: '自来水经处理可饮（建议瓶装）', scams: ['"捡钱平分"骗局', '街头"黄金/名牌"低价假货'],
    sos: { local: 'ساعدني من فضلك. اتصل بالشرطة', phonetic: 'Sa\'idni min fadlik. Ittasil bish-shurta' },
  },
  {
    code: 'GB', nameZh: '英国', nameEn: 'United Kingdom', langCode: 'en-GB',
    emergency: { police: '999', ambulance: '999', fire: '999' },
    embassy: '+44 20 7299 4049', tipping: '餐厅常见 10-15%，账单多含服务费', voltage: '230V · G 型插座', currency: '英镑 GBP',
    water: '自来水可直接饮用', scams: ['街头"拾金平分"骗局', '牛津街"便宜香水/耳机"假货'],
    sos: { local: 'Please help me. Call the police', phonetic: 'Please help me. Call the police' },
  },
  {
    code: 'FR', nameZh: '法国', nameEn: 'France', langCode: 'fr-FR',
    emergency: { police: '112', ambulance: '112', fire: '112' },
    embassy: '+33 1 4952 1950', tipping: '账单已含服务费，可留 5-10% 零钱', voltage: '230V · C/E 型插座', currency: '欧元 EUR',
    water: '自来水可直接饮用', scams: ['埃菲尔铁塔/景点"签名骗局"', '地铁站假售票员/假票'],
    sos: { local: 'Aidez-moi, s\'il vous plaît. Appelez la police', phonetic: 'Aidez-mwa, sil vu plè. Aple la polis' },
  },
  {
    code: 'DE', nameZh: '德国', nameEn: 'Germany', langCode: 'de-DE',
    emergency: { police: '110', ambulance: '112', fire: '112' },
    embassy: '+49 30 27588510', tipping: '非强制，餐厅常凑整或留 5-10%', voltage: '230V · C/F 型插座', currency: '欧元 EUR',
    water: '自来水可直接饮用', scams: ['柏林"签名募捐"骗局', '假警察查护照（真警察不查现金）'],
    sos: { local: 'Helfen Sie mir bitte. Rufen Sie die Polizei', phonetic: 'Helfen zee meer bitte. Rufen zee dee Politsai' },
  },
  {
    code: 'IT', nameZh: '意大利', nameEn: 'Italy', langCode: 'it-IT',
    emergency: { police: '112', ambulance: '112', fire: '112' },
    embassy: '+39 06 96524200', tipping: '账单已含服务费，可留零钱', voltage: '230V · C/F/L 型插座', currency: '欧元 EUR',
    water: '自来水可直接饮用', scams: ['罗马喂鸽子拍照收费', '火车站"好心人"帮买票'],
    sos: { local: 'Aiuto, per favore. Chiamate la polizia', phonetic: 'Aiuto, per favore. Kiamate la politsia' },
  },
  {
    code: 'ES', nameZh: '西班牙', nameEn: 'Spain', langCode: 'es-ES',
    emergency: { police: '112', ambulance: '112', fire: '112' },
    embassy: '+34 91 519 4242', tipping: '非强制，账单已含服务费', voltage: '230V · C/F 型插座', currency: '欧元 EUR',
    water: '自来水可直接饮用', scams: ['巴塞罗那街头"洒脏东西帮擦"', '假警察查护照'],
    sos: { local: 'Ayúdeme, por favor. Llame a la policía', phonetic: 'Ayúdeme, por favor. Yame a la polisia' },
  },
  {
    code: 'RU', nameZh: '俄罗斯', nameEn: 'Russia', langCode: 'ru-RU',
    emergency: { police: '112', ambulance: '112', fire: '112' },
    embassy: '+7 499 951 8435', tipping: '餐厅常见 10%', voltage: '220V · C/F 型插座', currency: '卢布 RUB',
    water: '自来水不建议直饮，买瓶装水', scams: ['出租车不打表漫天要价', '换汇店"手续费陷阱"'],
    sos: { local: 'Помогите, пожалуйста. Вызовите полицию', phonetic: 'Pomogite, pozhaluysta. Vyzovite politsiyu' },
  },
  {
    code: 'US', nameZh: '美国', nameEn: 'United States', langCode: 'en-US',
    emergency: { police: '911', ambulance: '911', fire: '911' },
    embassy: '+1 202 495 2266', tipping: '小费文化强：餐饮 15-20%，行李 1-2 美元/件', voltage: '120V · A/B 型插座', currency: '美元 USD',
    water: '自来水可直接饮用', scams: ['景点"签名募捐"', '假警察/机场"查护照"骗局'],
    sos: { local: 'Please help me. Call the police', phonetic: 'Please help me. Call the police' },
  },
  {
    code: 'CA', nameZh: '加拿大', nameEn: 'Canada', langCode: 'en-CA',
    emergency: { police: '911', ambulance: '911', fire: '911' },
    embassy: '+1 613 789 3434', tipping: '餐饮 15-20%，账单多已含服务费', voltage: '120V · A/B 型插座', currency: '加元 CAD',
    water: '自来水可直接饮用', scams: ['信用卡盗刷（小额免密慎用）', '街头"慈善募捐"冒名'],
    sos: { local: 'Please help me. Call the police', phonetic: 'Please help me. Call the police' },
  },
  {
    code: 'MX', nameZh: '墨西哥', nameEn: 'Mexico', langCode: 'es-MX',
    emergency: { police: '911', ambulance: '911', fire: '911' },
    embassy: '+52 55 5616 0609', tipping: '餐饮 10-15%，行李 10-20 比索', voltage: '127V · A/B 型插座', currency: '墨西哥比索 MXN',
    water: '自来水不建议直饮，买瓶装水', scams: ['出租车不打表虚高报价，用 Uber', 'ATM 机"吞卡"诈骗'],
    sos: { local: 'Ayúdeme, por favor. Llame a la policía', phonetic: 'Ayúdeme, por favor. Yame a la polisia' },
  },
  {
    code: 'AU', nameZh: '澳大利亚', nameEn: 'Australia', langCode: 'en-AU',
    emergency: { police: '000', ambulance: '000', fire: '000' },
    embassy: '+61 2 6228 3999', tipping: '非强制，餐饮可留 10%', voltage: '230V · I 型插座', currency: '澳元 AUD',
    water: '自来水可直接饮用', scams: ['沙滩"超低价旅游套餐"', '租赁押金纠纷（入住前拍照留证）'],
    sos: { local: 'Please help me. Call the police', phonetic: 'Please help me. Call the police' },
  },
  {
    code: 'NZ', nameZh: '新西兰', nameEn: 'New Zealand', langCode: 'en-NZ',
    emergency: { police: '111', ambulance: '111', fire: '111' },
    embassy: '+64 4 473 3514', tipping: '非强制，服务好可留小费', voltage: '230V · I 型插座', currency: '新西兰元 NZD',
    water: '自来水可直接饮用', scams: ['背包客搭车风险（告知行程）', '"超低价住宿"定金骗局'],
    sos: { local: 'Please help me. Call the police', phonetic: 'Please help me. Call the police' },
  },
];