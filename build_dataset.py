import urllib.request
import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

print("1. Fetching KanjiDictVN...")
url_vn = 'https://raw.githubusercontent.com/trungnt2910/KanjiDictVN/master/out_vn/kanji_bank_1.json'
req_vn = urllib.request.Request(url_vn, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req_vn) as resp:
    dict_vn_raw = json.loads(resp.read().decode('utf-8'))

# Map char to entry
vn_dict = {}
for item in dict_vn_raw:
    char = item[0]
    hv_str = item[1].strip()
    # parse meanings: remove bracket prefix e.g. '[nhật] Mặt Trời' -> 'Mặt Trời'
    meanings = []
    for m in item[4]:
        clean_m = re.sub(r'^\[[^\]]+\]\s*', '', m).strip()
        if clean_m and clean_m not in meanings:
            meanings.append(clean_m)
    
    info = item[5] if len(item) > 5 else {}
    vn_dict[char] = {
        'hv': hv_str.upper().split(),
        'meanings': meanings,
        'radical': info.get('Radical', ''),
        'pen': info.get('PenStrokes', '')
    }

print(f"KanjiDictVN loaded: {len(vn_dict)} entries")

# Traditional mappings for Shinjitai that had empty meanings
shinjitai_to_kyujitai = {
    '読': '讀', '売': '賣', '広': '廣', '図': '圖', '黒': '黑', '駅': '驛',
    '対': '對', '実': '實', '戦': '戰', '済': '濟', '変': '變', '収': '收',
    '満': '滿', '処': '處', '経': '經', '当': '當', '数': '數', '発': '發',
    '点': '點', '県': '縣', '区': '區', '声': '聲', '会': '會', '体': '體',
    '学': '學', '国': '國', '気': '氣', '宝': '寶', '鉄': '鐵', '伝': '傳',
    '転': '轉', '単': '單', '独': '獨', '来': '來', '万': '萬', '医': '醫',
    '寿': '壽', '真': '眞', '画': '畫', '昼': '晝', '歩': '步', '歩': '步',
    '両': '兩', '両': '兩', '予': '豫', '余': '餘', '与': '與', '争': '爭',
    '仏': '佛', '仮': '假', '伝': '傳', '価': '價', '倹': '儉', '児': '兒',
    '円': '圓', '処': '處', '券': '劵', '剣': '劍', '剤': '劑', '剰': '剩',
    '労': '勞', '効': '效', '勧': '勸', '勲': '勳', '区': '區', '協': '恊',
    '単': '單', '厳': '嚴', '嘱': '囑', '囲': '圍', '圏': '圈', '圧': '壓',
    '塁': '壘', '壊': '壞', '壮': '壯', '声': '聲', '壱': '壹', '売': '賣',
    '変': '變', '奨': '奬', '嬢': '孃', '実': '實', '寝': '寢', '専': '專',
    '対': '對', '寿': '壽', '導': '導', '将': '將', '尽': '盡', '届': '屆',
    '峡': '峽', '巣': '巢', '帯': '帶', '帰': '歸', '庁': '廳', '廃': '廢',
    '延': '延', '弁': '瓣', '弊': '弊', '式': '式', '弾': '彈', '弥': '彌',
    '当': '當', '従': '從', '徳': '德', '徴': '徵', '応': '應', '恋': '戀',
    '恒': '恆', '恵': '惠', '悩': '惱', '悪': '惡', '慎': '愼', '惨': '慘',
    '戦': '戰', '戯': '戲', '戻': '戾', '払': '拂', '抜': '拔', '択': '擇',
    '担': '擔', '拠': '據', '拡': '擴', '摂': '攝', '揺': '搖', '損': '損',
    '撤': '撤', '数': '數', '斉': '齊', '断': '斷', '旧': '舊', '晋': '晉',
    '昼': '晝', '晴': '晴', '暁': '曉', '晩': '晚', '暑': '暑', '暦': '曆',
    '会': '會', '条': '條', '来': '來', '極': '極', '栄': '榮', '楽': '樂',
    '概': '槪', '構': '構', '様': '樣', '権': '權', '歓': '歡', '歩': '步',
    '歯': '齒', '歴': '歷', '残': '殘', '殴': '毆', '殺': '殺', '殻': '殼',
    '毎': '每', '気': '氣', '汚': '汚', '没': '沒', '沢': '澤', '浜': '濱',
    '浄': '淨', '浅': '淺', '済': '濟', '渉': '涉', '渋': '澀', '渓': '溪',
    '温': '溫', '満': '滿', '滞': '滯', '潜': '潛', '潤': '潤', '滝': '瀧',
    '瀬': '瀨', '灯': '燈', '点': '點', '煙': '煙', '焼': '燒', '照': '照',
    '犠': '犧', '状': '狀', '独': '獨', '猟': '獵', '獣': '獸', '献': '獻',
    '猶': '猶', '瓶': '甁', '画': '畫', '発': '發', '盗': '盜', '県': '縣',
    '真': '眞', '着': '著', '砕': '碎', '碑': '碑', '社': '社', '礼': '禮',
    '祝': '祝', '神': '神', '祥': '祥', '福': '福', '禅': '禪', '税': '稅',
    '穀': '穀', '突': '突', '節': '節', '粋': '粹', '糸': '絲', '経': '經',
    '絵': '繪', '絶': '絶', '継': '繼', '続': '續', '繊': '纖', '総': '總',
    '練': '練', '緑': '綠', '縁': '緣', '縄': '繩', '缶': '罐', '署': '署',
    '翻': '飜', '者': '者', '聴': '聽', '胆': '膽', '脳': '腦', '臓': '臟',
    '臭': '臭', '舎': '舍', '芸': '藝', '荘': '莊', '著': '著', '蔵': '藏',
    '薫': '薰', '薬': '藥', '虚': '虛', '虫': '蟲', '蛮': '蠻', '衛': '衞',
    '視': '視', '覧': '覽', '触': '觸', '訳': '譯', '訴': '訴', '証': '證',
    '評': '評', '詞': '詞', '詠': '詠', '試': '試', '詰': '詰', '話': '話',
    '読': '讀', '調': '調', '譲': '讓', '謁': '謁', '諸': '諸', '諾': '諾',
    '講': '講', '谷': '谷', '豊': '豐', '豚': '豚', '賛': '贊', '賞': '賞',
    '賢': '賢', '質': '質', '購': '購', '贈': '贈', '身': '身', '車': '車',
    '転': '轉', '軽': '輕', '辺': '邊', '迭': '迭', '迫': '迫', '逝': '逝',
    '逢': '逢', '運': '運', '過': '過', '道': '道', '達': '達', '遮': '遮',
    '遷': '遷', '還': '還', '邦': '邦', '都': '都', '郷': '鄕', '酔': '醉',
    '醸': '釀', '釈': '釋', '鉄': '鐵', '鉱': '鑛', '銭': '錢', '銘': '銘',
    '鋭': '銳', '鋳': '鑄', '錬': '鍊', '鎮': '鎭', '鑑': '鑑', '闘': '鬪',
    '閲': '閱', '関': '關', '阪': '阪', '防': '防', '降': '降', '陣': '陣',
    '険': '險', '隠': '隱', '隣': '隣', '隷': '隸', '雑': '雜', '霊': '靈',
    '静': '靜', '領': '領', '頬': '頰', '頭': '頭', '顕': '顯', '顔': '顏',
    '頼': '賴', '題': '題', '額': '額', '類': '類', '飲': '飲', '飼': '飼',
    '館': '館', '駅': '驛', '駆': '驅', '験': '驗', '騒': '騷', '駅': '驛',
    '骨': '骨', '体': '體', '高': '高', '髪': '髮', '鬼': '鬼', '魔': '魔',
    '魚': '魚', '鳥': '鳥', '鳴': '鳴', '鶴': '鶴', '麦': '麥', '黄': '黃',
    '黒': '黑', '黙': '默', '党': '黨', '鼓': '鼓', '鼻': '鼻', '斎': '齋',
    '歯': '齒', '竜': '龍', '亀': '龜', '剥': '剝', '剝': '剝'
}

# English-to-Vietnamese quick fallback dictionary for common kanji terms
en_vi_fallback = {
    'read': 'đọc', 'sell': 'bán', 'station': 'nhà ga', 'wide': 'rộng lớn',
    'broad': 'rộng', 'spacious': 'thênh thang', 'black': 'màu đen', 'map': 'bản đồ',
    'drawing': 'bản vẽ', 'plan': 'kế hoạch', 'get thin': 'gầy sút',
    'settle (debt, etc.)': 'giải quyết, xong xuôi', 'relieve (burden)': 'giúp đỡ',
    'finish': 'hoàn thành', 'come to an end': 'kết thúc', 'unusual': 'bất thường',
    'change': 'biến đổi, thay đổi', 'strange': 'kỳ lạ', 'income': 'thu nhập',
    'obtain': 'đạt được', 'reap': 'thu hoạch', 'store': 'cất giữ',
    'full': 'đầy đủ', 'fullness': 'viên mãn', 'enough': 'thỏa mãn',
    'dispose': 'xử lý', 'manage': 'quản lý', 'deal with': 'đối phó',
    'place': 'nơi chốn', 'reality': 'thực tế, có thật', 'truth': 'sự thật',
    'seed': 'hạt', 'fruit': 'hoa quả, kết quả', 'war': 'chiến tranh',
    'battle': 'trận đánh', 'match': 'thi đấu', 'vis-a-vis': 'đối diện',
    'opposite': 'ngược lại, đối lập', 'even': 'ngang bằng', 'compare': 'so sánh',
    'depart': 'xuất phát', 'discharge': 'phát ra', 'emit': 'tỏa ra',
    'start from': 'bắt đầu từ', 'point': 'điểm', 'mark': 'dấu vết',
    'prefecture': 'tỉnh (hành chính)', 'ward': 'khu, quận', 'district': 'khu vực',
    'voice': 'tiếng, giọng nói', 'say': 'nói', 'sound': 'âm thanh',
    'meet': 'gặp gỡ', 'party': 'hội hè', 'association': 'hiệp hội',
    'body': 'thân thể, cơ thể', 'substance': 'bản thể, vật chất',
    'study': 'học tập', 'learning': 'học vấn', 'science': 'khoa học',
    'country': 'quốc gia, đất nước', 'spirit': 'tinh thần, khí chất',
    'mind': 'tâm trí', 'air': 'không khí', 'atmosphere': 'khí quyển',
    'treasure': 'báu vật, bảo vật', 'wealth': 'của cải', 'iron': 'sắt thép',
    'transmit': 'truyền bá', 'report': 'truyền đạt', 'communicate': 'thông báo',
    'revolve': 'quay, xoay quanh', 'turn around': 'chuyển hướng', 'change': 'thay đổi',
    'single': 'đơn độc, đơn chiếc', 'simple': 'đơn giản', 'alone': 'một mình',
    'come': 'đến, lại', 'due': 'tới hạn', 'next': 'kế tiếp',
    'ten thousand': 'mười nghìn, vạn', 'doctor': 'bác sĩ', 'medicine': 'y học',
    'longevity': 'sống thọ', 'congratulations': 'chúc thọ', 'one\'s natural life': 'tuổi thọ',
    'true': 'chân thật, chân lý', 'reality': 'thực tế', 'picture': 'bức tranh',
    'drawing': 'hội họa', 'stroke': 'nét vẽ', 'daytime': 'ban ngày',
    'noon': 'buổi trưa', 'walk': 'đi bộ', 'step': 'bước đi', 'both': 'cả hai',
    'beforehand': 'dự liệu, trước', 'previous': 'trước đó', 'myself': 'bản thân',
    'surplus': 'dư thừa', 'remainder': 'phần còn lại', 'give': 'cho, ban cho',
    'award': 'tặng thưởng', 'cause': 'gây ra', 'contend': 'tranh chấp',
    'dispute': 'tranh cãi', 'argue': 'tranh luận', 'Buddha': 'Phật',
    'shrine': 'điện thờ', 'idol': 'tượng thần', 'provisional': 'giả thiết, tạm thời',
    'price': 'giá cả', 'cost': 'giá trị', 'value': 'giá trị', 'frugal': 'tiết kiệm',
    'economy': 'tiết độ', 'thrifty': 'tằn tiện', 'child': 'trẻ nhỏ, con nhỏ',
    'round': 'tròn, hình tròn', 'circle': 'vòng tròn', 'ticket': 'vé, phiếu',
    'sabre': 'thanh kiếm', 'sword': 'gươm', 'blade': 'lưỡi kiếm', 'dose': 'liều thuốc',
    'surplus': 'thừa dư', 'labor': 'lao động', 'thank for': 'cảm ơn sự vất vả',
    'merit': 'công lao', 'efficiency': 'hiệu quả', 'benefit': 'tác dụng',
    'encourage': 'khuyên nhủ', 'recommend': 'khuyến khích', 'merit': 'công trạng',
    'honor': 'huân chương', 'strict': 'nghiêm khắc', 'severity': 'nghiêm trang',
    'entrust': 'ủy thác', 'request': 'nhờ vả', 'surround': 'bao quanh',
    'enclosure': 'vây quanh', 'sphere': 'khí quyển, phạm vi', 'circle': 'vòng tròn',
    'pressure': 'áp lực', 'push': 'đè, nén', 'base': 'thành lũy',
    'fort': 'lũy điểm', 'demolition': 'phá hủy', 'break': 'làm hỏng',
    'robust': 'tráng kiện', 'manly': 'mạnh mẽ', 'one': 'một', 'bestow': 'khen thưởng',
    'reward': 'tặng thưởng', 'daughter': 'tiểu thư, con gái', 'sleep': 'ngủ',
    'rest': 'nghỉ ngơi', 'specialty': 'chuyên môn', 'exclusive': 'chuyên dụng',
    'guiding': 'dẫn đường', 'lead': 'hướng dẫn', 'general': 'vị tướng',
    'leader': 'chỉ huy', 'exhaust': 'tận cùng, hết sức', 'deliver': 'chuyển đến',
    'reach': 'đạt tới', 'ravine': 'hẻm núi', 'gorge': 'khe suối', 'nest': 'tổ chim',
    'rookery': 'tổ ấm', 'sash': 'thắt lưng, dải đai', 'belt': 'vành đai',
    'homecoming': 'về nhà', 'return': 'quay về', 'government office': 'cơ quan nhà nước',
    'abrogate': 'bãi bỏ, phế thải', 'petal': 'cánh hoa', 'bad habits': 'tệ nạn',
    'spring': 'lò xo', 'bounce': 'đàn hồi', 'shot': 'viên đạn', 'increasingly': 'ngày càng',
    'obey': 'tuân theo', 'submit to': 'phục tùng', 'follow': 'theo sau',
    'benevolence': 'đạo đức, đức hạnh', 'virtue': 'ân đức', 'indication': 'chứng cứ',
    'sign': 'dấu hiệu', 'omen': 'điềm báo', 'apply': 'ứng đối', 'answer': 'đáp lại',
    'romance': 'tình yêu', 'in love': 'say đắm', 'yearn for': 'thương nhớ',
    'constant': 'bình thường, thường trực', 'favor': 'ân huệ', 'blessing': 'ơn nghĩa',
    'trouble': 'lo âu, phiền não', 'worry': 'buồn phiền', 'bad': 'xấu, ác',
    'evil': 'hung ác', 'humility': 'thận trọng', 'be careful': 'cẩn thận',
    'wretched': 'thảm thương', 'disaster': 'thảm khốc', 'play': 'vui chơi',
    'sport': 'trò chơi', 'recline': 'quay lại', 'relapse': 'trở về',
    'pay': 'chi trả', 'brush off': 'phủi đi', 'pluck': 'nhổ, rút ra',
    'pull out': 'chọn lọc', 'choose': 'lựa chọn', 'select': 'tuyển chọn',
    'shouldering': 'gánh vác', 'carry': 'đảm nhiệm', 'foothold': 'căn cứ',
    'based on': 'dựa vào', 'broaden': 'mở rộng', 'expand': 'khuếch trương',
    'take in': 'tiếp thu', 'absorb': 'hấp thụ', 'shake': 'rung lắc',
    'swing': 'đu đưa', 'loss': 'tổn hại', 'damage': 'hao hụt',
    'remove': 'triệt thoái', 'withdraw': 'rút lui', 'alike': 'đồng đều, ngang nhau',
    'sever': 'cắt đứt', 'refuse': 'từ chối', 'old times': 'ngày xưa, thời xưa',
    'former': 'cũ, trước', 'advance': 'thăng tiến', 'clear weather': 'trời quang đãng',
    'fair': 'trong sáng', 'daybreak': 'rạng đông', 'dawn': 'bình minh',
    'nightfall': 'hoàng hôn', 'night': 'ban đêm', 'hot': 'nóng nực',
    'summer heat': 'mùa hè', 'calendar': 'lịch, niên lịch', 'almanac': 'lịch sách',
    'clause': 'điều khoản', 'item': 'mục lục', 'utmost': 'cực điểm, cùng cực',
    'most': 'rất, nhất', 'flourish': 'thịnh vượng, phồn vinh', 'glory': 'vinh quang',
    'music': 'âm nhạc', 'comfort': 'vui vẻ', 'ease': 'nhàn nhã',
    'approximate': 'khái lược, đại khái', 'posture': 'cấu trúc', 'build': 'tạo dựng',
    'manner': 'dáng vẻ', 'situation': 'tình hình', 'authority': 'quyền lực',
    'power': 'quyền thế', 'delight': 'hoan hỷ, vui mừng', 'joy': 'vui vẻ',
    'tooth': 'răng', 'curriculum': 'kinh lịch, lý lịch', 'continuation': 'nối tiếp',
    'remainder': 'còn lại', 'leftover': 'thừa', 'assault': 'đánh đập',
    'strike': 'ẩu đả', 'kill': 'giết hại', 'murder': 'sát hại',
    'husk': 'vỏ trứng, mai', 'nut shell': 'vỏ sò', 'every': 'mỗi một, mọi',
    'dirty': 'dơ bẩn', 'pollute': 'ô nhiễm', 'drown': 'chìm đắm',
    'sink': 'chìm ngập', 'swamp': 'đầm lầy', 'seashore': 'bãi biển',
    'beach': 'bờ biển', 'clean': 'thanh tịnh', 'pure': 'trong sạch',
    'purify': 'tẩy sạch', 'shallow': 'nông cạn', 'superficial': 'nông nổi',
    'ford': 'lội qua', 'ferry': 'vượt sông', 'astringent': 'chát, đắng',
    'hesitate': 'ngập ngừng', 'mountain stream': 'khe suối', 'valley': 'thung lũng',
    'warm': 'ấm áp', 'warmth': 'nhiệt độ', 'stagnate': 'ngưng trệ',
    'delay': 'chậm trễ', 'submerge': 'lặn, ẩn nấp', 'conceal': 'che giấu',
    'wet': 'ẩm ướt', 'profit': 'nhuận sắc, lợi nhuận', 'waterfall': 'thác nước',
    'rapids': 'ghềnh thác', 'current': 'dòng chảy', 'lamp': 'ngọn đèn',
    'light': 'ánh sáng', 'smoke': 'khói thuốc, hơi khói', 'bake': 'nướng, đốt',
    'burning': 'cháy rực', 'illuminate': 'chiếu sáng', 'shine': 'soi sáng',
    'sacrifice': 'hi sinh', 'form': 'hình trạng, dáng vẻ', 'appearance': 'trạng thái',
    'hunting': 'săn bắn', 'beast': 'thú vật', 'animal': 'muông thú',
    'offering': 'hiến tế, cúng tế', 'present': 'dâng tặng', 'flower pot': 'bình hoa, chậu',
    'steal': 'trộm cắp', 'rob': 'cướp đoạt', 'arrive': 'đến nơi',
    'wear': 'mặc áo', 'smash': 'đập vỡ', 'break': 'tan vỡ',
    'tombstone': 'bia đá', 'monument': 'đài kỷ niệm', 'company': 'công ty',
    'association': 'hội đoàn', 'etiquette': 'lễ nghi', 'rite': 'lễ bái',
    'celebrate': 'chúc mừng', 'congratulate': 'chúc phúc', 'gods': 'thần linh',
    'mind': 'tâm linh', 'favorable': 'cát tường, điềm lành', 'good luck': 'may mắn',
    'blessing': 'hạnh phúc', 'fortune': 'phước lành', 'Zen': 'Thiền',
    'silent meditation': 'thiền định', 'tax': 'thuế má', 'duty': 'thuế quan',
    'grains': 'ngũ cốc', 'cereal': 'lúa gạo', 'thrust': 'đột kích, xông tới',
    'pierce': 'đâm thủng', 'node': 'tiết điệu, mắt tre', 'season': 'thời tiết',
    'pure': 'tinh túy', 'essence': 'thuần khiết', 'thread': 'sợi chỉ, tơ lụa',
    'picture': 'bức tranh', 'drawing': 'tranh vẽ', 'discontinue': 'tuyệt giao',
    'sever': 'cắt đứt', 'inherit': 'kế thừa', 'patch': 'tiếp nối',
    'continue': 'tiếp tục', 'series': 'liên tục', 'slender': 'thanh mảnh',
    'fine': 'tế nhị, nhỏ bé', 'general': 'tổng quát, tổng cộng', 'whole': 'toàn thể',
    'practice': 'luyện tập', 'discipline': 'rèn luyện', 'green': 'màu xanh lục',
    'edge': 'mối duyên, quan hệ', 'relation': 'duyên cớ', 'straw rope': 'dây thừng',
    'can': 'lon, hộp kim loại', 'tin': 'đồ hộp', 'government office': 'cơ quan',
    'station': 'sở chỉ huy', 'flip': 'lật lại', 'turn over': 'phiên dịch, lật úp',
    'listen': 'lắng nghe', 'headstrong': 'can đảm', 'gall bladder': 'túi mật',
    'brain': 'não bộ', 'memory': 'trí óc', 'entrails': 'nội tạng',
    'viscera': 'lục phủ ngũ tạng', 'odor': 'mùi hôi, hôi thối', 'stink': 'khó ngửi',
    'cottage': 'nhà ở, ký túc', 'hut': 'quán trọ', 'art': 'nghệ thuật',
    'technique': 'kỹ nghệ', 'villa': 'trang viên', 'manor': 'trang trại',
    'storehouse': 'kho tàng', 'hide': 'cất giấu', 'fragrant': 'hương thơm',
    'smoke': 'xông hương', 'medication': 'thuốc men', 'drug': 'dược phẩm',
    'emptiness': 'hư không', 'vacuum': 'trống rỗng', 'insect': 'côn trùng',
    'bug': 'sâu bọ', 'barbarian': 'man rợ, man tộc', 'defense': 'phòng vệ',
    'protection': 'bảo vệ', 'look at': 'nhìn xem', 'inspect': 'quan sát',
    'look over': 'xem xét', 'view': 'thưởng lãm', 'contact': 'tiếp xúc',
    'feel': 'chạm vào', 'translate': 'phiên dịch', 'reason': 'giải thích',
    'lawsuit': 'kiện tụng', 'plea': 'khiếu nại', 'evidence': 'chứng cớ',
    'proof': 'bằng chứng', 'evaluate': 'đánh giá', 'critique': 'bình luận',
    'parts of speech': 'từ loại', 'words': 'từ ngữ', 'recitation': 'ngâm thơ',
    'poem': 'bài thơ', 'test': 'thử nghiệm', 'attempt': 'thi cử',
    'crammed': 'nhồi nhét, đông đúc', 'talk': 'nói chuyện', 'topic': 'câu chuyện',
    'tune': 'điều chỉnh', 'investigate': 'điều tra', 'defer': 'nhường nhịn',
    'yield': 'nhượng bộ', 'audience': 'yết kiến', 'various': 'các loại, chư vị',
    'many': 'nhiều', 'consent': 'ưng thuận', 'assent': 'chấp nhận',
    'lecture': 'giảng dạy', 'club': 'giảng khóa', 'valley': 'thung lũng',
    'bountiful': 'phong phú', 'rich': 'màu mỡ', 'pork': 'thịt lợn',
    'pig': 'con heo', 'praise': 'tán dương', 'agree': 'tán thành',
    'prize': 'giải thưởng', 'reward': 'khen ngợi', 'intelligent': 'hiền triết',
    'wise': 'thông thái', 'substance': 'chất lượng', 'quality': 'bản chất',
    'buy': 'mua hàng', 'subscribe': 'đặt mua', 'presents': 'quà tặng',
    'send': 'tặng gửi', 'somebody': 'bản thân', 'person': 'thân thể',
    'car': 'xe hơi', 'wheel': 'xe cộ', 'light': 'nhẹ',
    'trifling': 'nhẹ nhàng', 'environs': 'vùng lân cận', 'boundary': 'biên giới',
    'transfer': 'thay đổi', 'alternate': 'luân chuyển', 'force': 'bức bách',
    'urge': 'ép buộc', 'die': 'qua đời', 'pass away': 'tạ thế',
    'meeting': 'gặp gỡ', 'rendezvous': 'hội ngộ', 'carry': 'vận chuyển',
    'luck': 'vận may', 'destiny': 'số mệnh', 'overdo': 'quá độ',
    'exceed': 'vượt quá', 'road-way': 'con đường', 'street': 'đạo lộ',
    'accomplished': 'đạt được', 'reach': 'thông đạt', 'intercept': 'ngăn chặn',
    'interrupt': 'chắn lối', 'transition': 'dời chuyển', 'change': 'biến thiên',
    'send back': 'hoàn trả', 'return': 'quay lại', 'state': 'bang quốc',
    'country': 'đất nước', 'metropolis': 'kinh đô', 'capital': 'đô thị',
    'home town': 'quê hương', 'village': 'làng xóm', 'drunk': 'say rượu',
    'feel sick': 'say mèm', 'brew': 'ủ men, nấu rượu', 'ferment': 'lên men',
    'explanation': 'giải thích', 'unravel': 'khai mở', 'ore': 'quặng mỏ',
    'mineral': 'khoáng sản', 'coin': 'đồng tiền', 'money': 'tiền bạc',
    'inscription': 'khắc ghi', 'signature': 'danh ngôn', 'pointed': 'sắc nhọn',
    'sharp': 'bén nhọn', 'cast': 'đúc đồng', 'mint': 'đúc kim loại',
    'tempering': 'rèn luyện', 'refine': 'tinh luyện', 'quell': 'trấn an',
    'tranquilize': 'lắng dịu', 'appraisal': 'giám định', 'mirror': 'gương mẫu',
    'fight': 'chiến đấu', 'war': 'tranh đấu', 'inspection': 'kiểm duyệt',
    'reading': 'duyệt lãm', 'connection': 'liên quan', 'gate': 'cửa ải',
    'heights': 'dốc núi', 'slope': 'bờ nghiêng', 'ward off': 'phòng vệ',
    'defend': 'phòng ngự', 'descend': 'hạ xuống', 'precipitate': 'rơi xuống',
    'fall': 'giáng xuống', 'camp': 'trận địa', 'battle array': 'chiến trận',
    'precipitous': 'hiểm trở', 'inaccessible': 'nguy hiểm', 'conceal': 'ẩn giấu',
    'hide': 'che khuất', 'neighboring': 'láng giềng', 'adjacent': 'bên cạnh',
    'slave': 'nô lệ', 'servant': 'tôi tớ', 'miscellaneous': 'hỗn tạp',
    'blend': 'tạp nham', 'spirits': 'linh hồn', 'soul': 'linh nghiệm',
    'quiet': 'yên tĩnh', 'calm': 'bình tĩnh', 'jurisdiction': 'lãnh thổ',
    'dominion': 'lãnh tụ', 'cheek': 'gò má', 'head': 'cái đầu',
    'counter for large animals': 'đầu con vật', 'appear': 'hiển thị',
    'clear': 'hiện rõ', 'face': 'khuôn mặt', 'expression': 'nhan sắc',
    'trust': 'trông cậy', 'request': 'nhờ vả', 'topic': 'chủ đề',
    'subject': 'đề mục', 'amount': 'hạn mức, số tiền', 'forehead': 'trán',
    'variety': 'chủng loại', 'genus': 'loại hình', 'drink': 'uống',
    'smoke': 'hút', 'breed': 'nuôi dưỡng', 'raise': 'chăn nuôi',
    'building': 'tòa nhà', 'mansion': 'quán xá', 'drive': 'xua đuổi',
    'run': 'chạy xe', 'verification': 'thử nghiệm', 'effect': 'hiệu nghiệm',
    'boisterous': 'ồn ào', 'clamor': 'huyên náo', 'skeleton': 'xương cốt',
    'bone': 'khung xương', 'tall': 'cao lớn', 'high': 'nổi bật',
    'hair of the head': 'mái tóc', 'ghost': 'ma quỷ', 'demon': 'quỷ dữ',
    'witch': 'yêu ma', 'fish': 'con cá', 'bird': 'con chim',
    'chirp': 'tiếng hót, kêu', 'cry': 'hót líu lo', 'crane': 'chim hạc',
    'stork': 'hạc trắng', 'wheat': 'lúa mì', 'barley': 'mạch',
    'yellow': 'màu vàng', 'silence': 'im lặng', 'dark': 'ngầm, tối',
    'party': 'đảng phái', 'faction': 'bè phái', 'drum': 'cái trống',
    'beat': 'đánh trống', 'nose': 'cái mũi', 'snout': 'khứu giác',
    'purification': 'trai giới', 'Buddhist food': 'cơm chay', 'dragon': 'con rồng',
    'imperial': 'long nhan', 'turtle': 'con rùa', 'tortoise': 'quy',
    'peel': 'bóc, lột', 'strip off': 'lột vỏ'
}

all_kanji = []

for lvl in ['n5', 'n4', 'n3', 'n2', 'n1']:
    print(f"Fetching {lvl.upper()}...")
    url = f'https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/kanji/{lvl}.json'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        kanji_list = json.loads(resp.read().decode('utf-8'))
        
    for k in kanji_list:
        char = k['character']
        code = format(ord(char), '05x')
        
        # 1. Sino-Vietnamese reading (Hán Việt)
        hv = []
        vi_meanings = []
        rad_vi = ''
        
        # Check direct match in KanjiDictVN
        if char in vn_dict:
            hv = vn_dict[char]['hv']
            vi_meanings = vn_dict[char]['meanings']
            rad_vi = vn_dict[char]['radical']
            
        # If missing or meanings empty, try traditional Kyujitai variant
        if (not vi_meanings or not hv) and char in shinjitai_to_kyujitai:
            kyu = shinjitai_to_kyujitai[char]
            if kyu in vn_dict:
                if not hv:
                    hv = vn_dict[kyu]['hv']
                if not vi_meanings:
                    vi_meanings = vn_dict[kyu]['meanings']
                if not rad_vi:
                    rad_vi = vn_dict[kyu]['radical']
                    
        # Special case for '剥' / '剝' and Kokuji
        kokuji_hv = {
            '剥': (['BÁC'], ['bóc, lột, tước đoạt', 'rơi rụng']),
            '剝': (['BÁC'], ['bóc, lột, tước đoạt', 'rơi rụng']),
            '畑': (['ĐIỀN'], ['ruộng khô, ruộng rẫy']),
            '凪': (['CHỈ'], ['gió lặng, sóng yên biển lặng']),
            '椋': (['LƯƠNG'], ['cây lương, chim sáo đá']),
            '蕗': (['LỘ'], ['cây phù ki (loại cúc dại Nhật Bản)'])
        }
        if char in kokuji_hv:
            hv = kokuji_hv[char][0]
            vi_meanings = kokuji_hv[char][1]

            
        # If still no vi_meanings, translate from English meanings
        if not vi_meanings:
            en_meanings = k.get('meanings', [])
            derived = []
            for en in en_meanings:
                en_lower = en.lower().strip()
                if en_lower in en_vi_fallback:
                    derived.append(en_vi_fallback[en_lower])
                elif ', ' in en_lower:
                    parts = [en_vi_fallback.get(p.strip(), p.strip()) for p in en_lower.split(', ')]
                    derived.append(', '.join(parts))
                else:
                    derived.append(en_lower)
            vi_meanings = derived

        # Onyomi & Kunyomi
        onyomi = k.get('onyomi', [])
        kunyomi = k.get('kunyomi', [])
        meanings_en = k.get('meanings', [])
        words = k.get('words', [])
        
        item = {
            'id': char,
            'c': char,
            'lvl': lvl.upper(),
            'hv': hv,
            'm_vi': vi_meanings[:5], # top 5 concise meanings
            'm_en': meanings_en[:5],
            'on': onyomi,
            'kun': kunyomi,
            'st': k.get('strokes', 0),
            'rad': k.get('radical', ''),
            'rad_vi': rad_vi,
            'words': words[:8],
            'code': code
        }
        all_kanji.append(item)

print(f"Total compiled Kanji: {len(all_kanji)}")

# Save to src/data/kanji_data.json
out_path = r'C:\Users\tuank\.gemini\antigravity\scratch\kanji-web\src\data\kanji_data.json'
import os
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(all_kanji, f, ensure_ascii=False, separators=(',', ':'))

print(f"File written to {out_path}, size: {os.path.getsize(out_path)/1024:.1f} KB")

# Verification
missing_hv = [x['c'] for x in all_kanji if not x['hv']]
missing_m_vi = [x['c'] for x in all_kanji if not x['m_vi']]
print(f"Missing HV: {len(missing_hv)}")
print(f"Missing Vietnamese Meaning: {len(missing_m_vi)}")
if missing_hv:
    print("Missing HV chars:", missing_hv[:10])
