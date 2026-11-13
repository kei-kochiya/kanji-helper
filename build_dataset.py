"""
Build src/data/kanji_data.json from OpenJLPT, KanjiDictVN, and hoc-tieng-nhat JLPT vocabulary.

Each kanji entry stores:
    c      Kanji character (id and 5-digit hex code are derived on load)
    lvl    JLPT level (N5..N1)
    hv     Ordered Sino-Vietnamese (Hán Việt) readings, primary reading first
    m_vi   Vietnamese meanings (up to 5 concise senses)
    m_en   English meanings (up to 5)
    on     Onyomi readings (Katakana)
    kun    Kunyomi readings (Hiragana)
    st     Stroke count
    rad    Radical character
    rad_vi Radical name in Vietnamese
    words  Up to 8 enriched Jukugo examples: {"w", "r", "hv", "m"}
"""
from collections import Counter
import json
from pathlib import Path
import re
import sys
import unicodedata
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent
OUT_PATH = ROOT / 'src' / 'data' / 'kanji_data.json'
HEADERS = {'User-Agent': 'kanji-helper-build'}

SHINJITAI_TO_KYUJITAI = {
    '読': '讀', '売': '賣', '広': '廣', '図': '圖', '黒': '黑', '駅': '驛', '痩': '瘦',
    '対': '對', '実': '實', '戦': '戰', '済': '濟', '変': '變', '収': '收', '満': '滿',
    '処': '處', '単': '單', '険': '險', '頼': '賴', '抜': '拔', '絶': '絕', '払': '拂',
    '雑': '雜', '戻': '戾', '絵': '繪', '県': '縣', '査': '查', '団': '團', '脳': '腦',
    '蔵': '藏', '捜': '搜', '圧': '壓', '齢': '齡', '囲': '圍', '軽': '輕', '巻': '卷',
    '焼': '燒', '臓': '臟', '悩': '惱', '緑': '綠', '鉱': '鑛', '涙': '淚', '畳': '疊',
    '挙': '舉', '検': '檢', '沢': '澤', '渉': '涉', '拡': '擴', '塁': '壘', '廃': '廢',
    '壊': '壞', '継': '繼', '拠': '據', '掲': '揭', '恵': '惠', '譲': '讓', '銭': '錢',
    '渋': '澀', '駆': '驅', '稲': '稻', '訳': '譯', '騒': '騷', '縄': '繩', '郷': '鄕',
    '釈': '釋', '瀬': '瀨', '陥': '陷', '竜': '龍', '桜': '櫻', '縦': '縱', '縁': '緣',
    '曽': '曾', '黙': '默', '寛': '寬', '壌': '壤', '舗': '鋪', '奨': '獎', '霊': '靈',
    '懐': '懷', '穏': '穩', '顕': '顯', '粛': '肅', '砕': '碎', '髄': '髓', '穂': '穗',
    '獣': '獸', '摂': '攝', '醸': '釀', '薫': '薰', '閲': '閱', '戯': '戲', '鶏': '雞',
    '挿': '插', '暁': '曉', '渇': '渴', '逓': '遞', '槙': '槇', '巌': '巖', '鋳': '鑄',
    '蛍': '螢', '嬢': '孃', '渓': '溪', '桟': '棧', '尭': '堯', '惣': '總', '錬': '鍊',
    '壱': '壹', '穣': '穰', '喩': '喻', '弐': '貳', '𠮟': '叱',
}

CURATED_KANJI = {
    '込': (['LIÊU', 'VU'], ['đông đúc, chật kín', 'cho vào, dồn vào', 'bao gồm (thuế, phí)']),
    '絶': (['TUYỆT'], ['tuyệt chủng, chấm dứt', 'cắt đứt, đoạn tuyệt', 'vô cùng, bậc nhất']),
    '畑': (['ĐIỀN'], ['ruộng khô, nương rẫy', 'vườn tược', 'lĩnh vực chuyên môn']),
    '査': (['TRA'], ['điều tra, kiểm tra', 'xem xét, thẩm tra']),
    '匂': (['CÁI'], ['mùi hương, hương thơm', 'tỏa mùi, bốc mùi']),
    '枠': (['KHUNG', 'HOA'], ['khung, viền khung', 'khuôn khổ, giới hạn', 'hạn ngạch, suất']),
    '栃': (['LỆ'], ['cây dẻ ngựa Nhật (tochi)', 'tỉnh Tochigi (栃木)']),
    '駄': (['ĐÀ'], ['ngựa thồ hàng', 'vô ích, phí công (無駄)', 'guốc gỗ (下駄)']),
    '笹': (['THẾ'], ['tre lùn, trúc lùn (sasa)']),
    '閲': (['DUYỆT'], ['kiểm duyệt, duyệt xem', 'đọc qua, tra cứu']),
    '峠': (['KHẢI'], ['đèo, đỉnh đèo', 'đỉnh điểm, lúc gay go nhất']),
    '槙': (['ĐIÊN'], ['cây tùng la hán (maki)', 'ngọn cây']),
    '塀': (['BÍNH'], ['tường rào, bờ tường']),
    '冴': (['NHẠ'], ['trong trẻo, sáng suốt', 'lạnh buốt, giá rét', 'sắc sảo, tài tình']),
    '凪': (['CHỈ'], ['gió lặng, sóng yên biển lặng']),
    '匁': (['LẠNG', 'LƯỠNG'], ['đơn vị cân cổ (monme ≈ 3,75g)']),
    '喩': (['DỤ'], ['ẩn dụ, ví von', 'so sánh, giải thích']),
    '捗': (['DUỆ', 'TRỌC'], ['tiến triển, tiến bộ (進捗)']),
    '柊': (['CHUNG'], ['cây ô rô (hiiragi)']),
    '柾': (['CỮU', 'CHÍNH'], ['thớ gỗ thẳng (masame)', 'cây hoàng dương']),
    '椋': (['LƯƠNG'], ['cây lương (muku)', 'chim sáo đá (椋鳥)']),
    '滉': (['HOẢNG'], ['mênh mông, sâu rộng (nước)', 'lấp lánh']),
    '澪': (['LINH'], ['luồng nước, lạch tàu thuyền đi']),
    '蕗': (['LỘ'], ['cây khoản đông, cúc tần Nhật (fuki)']),
    '麿': (['MI', 'MA'], ['ta, trẫm (đại từ cổ)', 'hậu tố tên người thời xưa']),
    '剥': (['BÁC'], ['bóc, lột, tước đoạt', 'bong tróc, rơi rụng']),
    '剝': (['BÁC'], ['bóc, lột, tước đoạt', 'bong tróc, rơi rụng']),
}

PREFERRED_HV = {
    '大': 'ĐẠI', '九': 'CỬU', '去': 'KHỨ', '語': 'NGỮ', '行': 'HÀNH', '生': 'SINH',
    '長': 'TRƯỜNG', '重': 'TRỌNG', '楽': 'LẠC', '説': 'THUYẾT', '見': 'KIẾN',
    '出': 'XUẤT', '分': 'PHÂN', '下': 'HẠ', '上': 'THƯỢNG', '中': 'TRUNG',
    '読': 'ĐỘC', '食': 'THỰC', '飲': 'ẨM', '校': 'HIỆU', '先': 'TIÊN',
    '日': 'NHẬT', '人': 'NHÂN', '年': 'NIÊN', '月': 'NGUYỆT', '明': 'MINH',
    '本': 'BẢN', '体': 'THỂ', '気': 'KHÍ', '国': 'QUỐC',
    '会': 'HỘI', '社': 'XÃ', '同': 'ĐỒNG', '自': 'TỰ',
    '発': 'PHÁT', '表': 'BIỂU', '者': 'GIẢ', '地': 'ĐỊA', '方': 'PHƯƠNG',
    '場': 'TRƯỜNG', '代': 'ĐẠI', '私': 'TƯ', '立': 'LẬP', '定': 'ĐỊNH',
    '力': 'LỰC', '目': 'MỤC', '度': 'ĐỘ', '回': 'HỒI', '用': 'DỤNG',
    '作': 'TÁC', '強': 'CƯỜNG', '公': 'CÔNG', '野': 'DÃ', '思': 'TƯ',
    '家': 'GIA', '世': 'THẾ', '多': 'ĐA', '正': 'CHÍNH', '安': 'AN',
    '院': 'VIỆN', '心': 'TÂM', '界': 'GIỚI', '教': 'GIÁO', '文': 'VĂN',
    '元': 'NGUYÊN', '考': 'KHẢO', '画': 'HỌA', '悪': 'ÁC',
    '族': 'TỘC', '親': 'THÂN', '切': 'THIẾT', '英': 'ANH', '店': 'ĐIẾM',
    '道': 'ĐẠO', '味': 'VỊ', '色': 'SẮC', '茶': 'TRÀ', '肉': 'NHỤC',
    '鳥': 'ĐIỂU', '魚': 'NGƯ', '犬': 'KHUYỂN', '物': 'VẬT', '品': 'PHẨM',
    '員': 'VIÊN', '仕': 'SĨ', '事': 'SỰ', '便': 'TIỆN', '利': 'LỢI',
    '特': 'ĐẶC', '別': 'BIỆT', '有': 'HỮU', '名': 'DANH', '数': 'SỐ',
}

CURATED_RAD_VI = {
    '剝': 'đao 刀 (+8 nét)',
}

EXTRA_VOCAB_VI = {
    '引き返す': 'quay lại; trở về',
    '天津': 'Thiên Tân',
    '中腹': 'lưng chừng núi',
    '鶏肉': 'thịt gà',
    '共': 'cùng; cả hai',
    '愛憎': 'yêu và ghét; ái ố',
    'ひっくり返す': 'lật ngược; đảo lộn',
    '朝ごはん': 'bữa sáng; cơm sáng',
    '日差し': 'ánh nắng mặt trời',
    '幹': 'thân cây; nòng cốt',
    '仮': 'tạm thời; giả định',
    '修業': 'tu nghiệp; rèn luyện',
    '逆さま': 'ngược; lộn ngược',
    '徐々': 'từ từ; dần dần',
}

VI_DIACRITIC_CHECK = set('àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ')


def fetch_json(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode('utf-8'))


def nfc(text: str) -> str:
    return unicodedata.normalize('NFC', text)


def parse_kanji_dict_vn() -> dict:
    print('1. Fetching KanjiDictVN (bank 1 & 2)...')
    kb1 = fetch_json('https://raw.githubusercontent.com/trungnt2910/KanjiDictVN/master/out_vn/kanji_bank_1.json')
    kb2 = fetch_json('https://raw.githubusercontent.com/trungnt2910/KanjiDictVN/master/out_vn/kanji_bank_2.json')

    vn_dict = {}
    for item in kb1 + kb2:
        char = item[0]
        raw_hvs = [nfc(x).upper() for x in item[1].strip().split() if x]
        bracket_counts: Counter[str] = Counter()
        meanings: list[str] = []
        for m in item[4]:
            m_norm = nfc(m)
            match = re.match(r'^\[([^\]]+)\]\s*(.*)', m_norm)
            if match:
                b_hv = match.group(1).strip().upper()
                bracket_counts[b_hv] += 1
                clean_m = match.group(2).strip()
            else:
                clean_m = m_norm.strip()
            if clean_m and clean_m not in meanings:
                meanings.append(clean_m)

        info = item[5] if len(item) > 5 else {}
        vn_dict[char] = {
            'raw_hvs': raw_hvs,
            'bracket_counts': bracket_counts,
            'meanings': meanings,
            'radical': nfc(info.get('Radical', '')),
        }
    print(f'   Loaded {len(vn_dict)} KanjiDictVN entries.')
    return vn_dict


def order_hv(char: str, raw_hvs: list[str], bracket_counts: Counter[str]) -> list[str]:
    ordered: list[str] = []
    pref = PREFERRED_HV.get(char)
    if pref and (pref in raw_hvs or pref in bracket_counts):
        ordered.append(pref)
    for h, _ in bracket_counts.most_common():
        if h not in ordered:
            ordered.append(h)
    for h in raw_hvs:
        if h not in ordered:
            ordered.append(h)
    return ordered


def load_vocab_sources() -> tuple[dict, dict]:
    print('2. Fetching OpenJLPT & hoc-tieng-nhat vocabularies...')
    open_vocab = {}
    vn_vocab = {}
    for lvl in ['n5', 'n4', 'n3', 'n2', 'n1']:
        for it in fetch_json(f'https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/vocab/{lvl}.json'):
            w = it.get('word')
            if w and w not in open_vocab:
                open_vocab[w] = it
        for it in fetch_json(f'https://raw.githubusercontent.com/meiiie/hoc-tieng-nhat/main/data/{lvl}.json'):
            w = it.get('kanji') or it.get('kana')
            if w and w not in vn_vocab:
                vn_vocab[w] = it
    print(f'   Loaded {len(open_vocab)} OpenJLPT vocab and {len(vn_vocab)} Vietnamese vocab entries.')
    return open_vocab, vn_vocab


def concise_vi_meaning(raw: str) -> str:
    parts = [p.strip() for p in nfc(raw).split(';') if p.strip()]
    return '; '.join(parts[:2])


def compound_hv(word: str, reading: str, primary_hv_map: dict[str, str]) -> str:
    parts: list[str] = []
    for idx, ch in enumerate(word):
        if not ('\u4e00' <= ch <= '\u9fff' or ch == '\U00020b9f'):
            continue
        hv = primary_hv_map.get(ch, '')
        if not hv:
            continue
        # Context-aware disambiguation for common multi-reading kanji in compounds
        if ch == '楽' and ('がく' in reading or 'らく' not in reading and ('音' in word or '器' in word)):
            hv = 'NHẠC'
        elif ch == '行' and ('ぎんこう' in reading or 'ぎょうれつ' in reading or 'りょこう' not in reading and word.startswith('銀行')):
            hv = 'HÀNG'
        elif ch == '長' and idx == len(word) - 1 and word in {'課長', '社長', '校長', '部長', '議長', '会長', '社長', '局長', '市長', '署長', '館長', '町長', '村長', '学長', '院長', '班長', '組長', '船長', '機長', '駅長', '店長'}:
            hv = 'TRƯỞNG'
        elif ch == '重' and ('じゅう' in reading or 'おも' in reading):
            hv = 'TRỌNG'
        elif ch == '重' and ('かさ' in reading or 'ちょう' in reading or 'え' in reading):
            hv = 'TRÙNG'
        elif ch == '大' and word == '大人':
            hv = 'ĐẠI'
        parts.append(hv)
    return ' '.join(parts)


def main() -> None:
    vn_dict = parse_kanji_dict_vn()
    open_vocab, vn_vocab = load_vocab_sources()

    raw_kanji = []
    for lvl in ['n5', 'n4', 'n3', 'n2', 'n1']:
        print(f'3. Fetching OpenJLPT kanji {lvl.upper()}...')
        items = fetch_json(f'https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/kanji/{lvl}.json')
        for k in items:
            raw_kanji.append((lvl.upper(), k))

    # First pass: resolve primary Hán Việt for every character so compound Jukugo HV is accurate
    primary_hv_map: dict[str, str] = {}
    resolved_entries = []

    for lvl, k in raw_kanji:
        char = k['character']
        entry = vn_dict.get(char)
        kyu = SHINJITAI_TO_KYUJITAI.get(char)
        kyu_entry = vn_dict.get(kyu) if kyu else None

        raw_hvs = list(entry['raw_hvs']) if entry else []
        bracket_counts = Counter(entry['bracket_counts']) if entry else Counter()
        vi_meanings = list(entry['meanings']) if entry else []
        rad_vi = entry['radical'] if entry else ''

        if kyu_entry:
            if not raw_hvs:
                raw_hvs = list(kyu_entry['raw_hvs'])
            if not bracket_counts:
                bracket_counts = Counter(kyu_entry['bracket_counts'])
            if not vi_meanings:
                vi_meanings = list(kyu_entry['meanings'])
            if not rad_vi:
                rad_vi = kyu_entry['radical']

        hv = order_hv(char, raw_hvs, bracket_counts)

        if char in CURATED_KANJI:
            cur_hv, cur_meanings = CURATED_KANJI[char]
            if not hv:
                hv = list(cur_hv)
            if not vi_meanings:
                vi_meanings = list(cur_meanings)

        if not rad_vi and char in CURATED_RAD_VI:
            rad_vi = CURATED_RAD_VI[char]

        if hv:
            primary_hv_map[char] = hv[0]

        resolved_entries.append((lvl, k, hv, vi_meanings, rad_vi))

    # Second pass: build final slimmed dataset with enriched Jukugo
    all_kanji = []
    missing_word_reading = 0
    missing_word_meaning = 0

    for lvl, k, hv, vi_meanings, rad_vi in resolved_entries:
        char = k['character']
        enriched_words = []
        for w in k.get('words', [])[:8]:
            ov = open_vocab.get(w, {})
            vv = vn_vocab.get(w, {})
            reading = nfc(vv.get('kana') or ov.get('reading') or '')
            meaning = concise_vi_meaning(vv.get('v') or EXTRA_VOCAB_VI.get(w, ''))
            if not reading:
                missing_word_reading += 1
            if not meaning:
                missing_word_meaning += 1
            enriched_words.append({
                'w': w,
                'r': reading,
                'hv': compound_hv(w, reading, primary_hv_map),
                'm': meaning,
            })

        item = {
            'c': char,
            'lvl': lvl,
            'hv': hv,
            'm_vi': [nfc(m) for m in vi_meanings[:5]],
            'm_en': k.get('meanings', [])[:5],
            'on': k.get('onyomi', []),
            'kun': k.get('kunyomi', []),
            'st': k.get('strokes', 0),
            'rad': k.get('radical', ''),
            'rad_vi': rad_vi,
            'words': enriched_words,
        }
        all_kanji.append(item)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(all_kanji, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    missing_hv = [x['c'] for x in all_kanji if not x['hv']]
    missing_m_vi = [x['c'] for x in all_kanji if not x['m_vi']]
    english_leaks = [
        x['c']
        for x in all_kanji
        if [m.lower() for m in x['m_vi']] == [m.lower() for m in x['m_en']]
        or any(
            m.lower() in [e.lower() for e in x['m_en']] and not any(ch in VI_DIACRITIC_CHECK for ch in m.lower())
            for m in x['m_vi']
        )
    ]

    print(f'Total compiled Kanji: {len(all_kanji)}')
    print(f'Wrote {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.1f} KB)')
    print(f'Missing HV: {len(missing_hv)}')
    print(f'Missing Vietnamese Meaning: {len(missing_m_vi)}')
    print(f'English leak count in m_vi: {len(english_leaks)}')
    print(f'Missing Jukugo reading: {missing_word_reading}')
    print(f'Missing Jukugo meaning: {missing_word_meaning}')


if __name__ == '__main__':
    main()
