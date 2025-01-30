// 在文件开头添加默认替换文本
const DEFAULT_REPLACEMENT = '*';
let replacementText = DEFAULT_REPLACEMENT;

// 默认词汇列表
const defaultCategories = {
    '脏话和粗俗用语': [
        '傻逼', '妈的', '操', '草', '艹', '滚蛋', '去死', '白痴', 
        '混蛋', '王八蛋', '狗娘', '婊子', '贱人', '人渣', '畜生',
        '废物', '白痴', '蠢货', '混球', '狗屎', '猪狗不如'
    ],
    '色情相关': [
        '色情', '做爱', '性交', '阴茎', '阴道', '淫秽', '淫荡', '卖淫',
        '嫖娼', '妓女', '性爱', '情色', '裸体', '乳房', '私密处',
        '性器官', '性服务', '一夜情', '约炮', '援交', '性虐待'
    ],
    '赌博相关': [
        '赌博', '博彩', '六合彩', '赌场', '赌钱', '赌注', '押注',
        '彩票', '老虎机', '百家乐', '德州扑克', '赌资', '赌徒',
        '庄家', '赌局', '赌场', '赌具'
    ],
    '毒品相关': [
        '毒品', '大麻', '冰毒', '海洛因', '可卡因', '摇头丸', 
        '吸毒', '贩毒', '毒贩', '致幻剂', '白粉', '麻古', '霹雳',
        '药品买卖', '违禁药品'
    ],
    '暴力相关': [
        '杀人', '自杀', '残害', '虐待', '暴打', '血腥', '残暴',
        '谋杀', '凶杀', '死亡', '暴力', '殴打', '斗殴', '群殴',
        '械斗', '持刀', '砍人', '伤害', '报复'
    ],
    '非法活动': [
        '走私', '偷渡', '非法', '违法', '犯罪', '作弊', '欺诈',
        '诈骗', '盗窃', '抢劫', '洗钱', '假币', '假钞', '假证'
    ],
    '歧视性语言': [
        '鬼佬', '阿三', '小日本', '黑鬼', '支那', '蝗虫', 
        '低等人', '贱民', '外地人', '乡巴佬'
    ],
    '自定义': [] // 用户自定义词汇
};

// 存储所有需要过滤的词汇
let inappropriateWords = [];

// 从存储中加载所有词汇
function loadAllWords(callback) {
    chrome.storage.sync.get({
        categories: defaultCategories,
        replacementText: DEFAULT_REPLACEMENT // 添加默认替换文本
    }, function(items) {
        // 合并所有分类中的词汇
        inappropriateWords = Object.values(items.categories)
            .flat()
            .filter(word => word && word.trim().length > 0);
        
        replacementText = items.replacementText; // 加载保存的替换文本
        
        if (callback) callback();
    });
}

// 检查当前网站是否在白名单中
function checkIfWhitelisted(callback) {
    const currentDomain = window.location.hostname;
    chrome.storage.sync.get({
        whitelistDomains: []
    }, function(items) {
        const isWhitelisted = items.whitelistDomains.some(domain => 
            currentDomain === domain || currentDomain.endsWith('.' + domain)
        );
        callback(isWhitelisted);
    });
}

// 将文本中的不当内容替换为星号
function replaceInappropriateContent(text) {
    let filteredText = text;
    inappropriateWords.forEach(word => {
        if (word && word.trim()) {
            const replacement = replacementText.repeat(word.length);
            const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            filteredText = filteredText.replace(regex, replacement);
        }
    });
    return filteredText;
}

// 遍历并处理页面上的文本节点
function filterTextContent(node) {
    if (node.nodeType === 3) { // 文本节点
        const originalText = node.nodeValue;
        const filteredText = replaceInappropriateContent(originalText);
        if (originalText !== filteredText) {
            node.nodeValue = filteredText;
        }
    } else {
        node.childNodes.forEach(filterTextContent);
    }
}

// 初始化过滤器
checkIfWhitelisted(function(isWhitelisted) {
    if (!isWhitelisted) {
        loadAllWords(function() {
            // 初始过滤
            filterTextContent(document.body);

            // 监听DOM变化，处理动态加载的内容
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        filterTextContent(node);
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // 监听存储变化，实时更新过滤词汇
            chrome.storage.onChanged.addListener(function(changes) {
                if (changes.categories) {
                    loadAllWords();
                }
            });
        });
    }
}); 