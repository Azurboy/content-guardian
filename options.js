// 定义词汇分类（使用默认词汇）
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
    '政治敏感': [
        '反动', '颠覆', '分裂', '暴动', '示威', '游行',
        '政变', '暴乱', '起义', '革命'
    ],
    '自定义': [] // 用户自定义词汇
};

let categories = JSON.parse(JSON.stringify(defaultCategories)); // 深拷贝默认分类

// 在文件开头添加默认替换文本常量
const DEFAULT_REPLACEMENT = '*';

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 添加新词汇
    document.getElementById('addWord').addEventListener('click', addNewWord);
    document.getElementById('newWord').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewWord();
        }
    });

    // 保存设置
    document.getElementById('save').addEventListener('click', saveSettings);
    
    // 重置按钮
    document.getElementById('reset').addEventListener('click', resetToDefault);

    // 添加替换文本输入事件
    const replacementInput = document.getElementById('replacementText');
    replacementInput.addEventListener('input', function() {
        // 限制最大长度为5
        if (this.value.length > 5) {
            this.value = this.value.slice(0, 5);
        }
        updatePreview();
    });
}

// 添加新词汇
function addNewWord() {
    const input = document.getElementById('newWord');
    const word = input.value.trim();
    
    if (word) {
        categories['自定义'].push(word);
        updateWordList();
        input.value = '';
    }
}

// 删除词汇
function deleteWord(category, word) {
    const index = categories[category].indexOf(word);
    if (index > -1) {
        categories[category].splice(index, 1);
        updateWordList();
    }
}

// 更新词汇列表显示
function updateWordList() {
    const wordList = document.getElementById('wordList');
    const categoryList = document.getElementById('categoryList');
    
    // 清空现有显示
    wordList.innerHTML = '';
    categoryList.innerHTML = '';

    // 显示自定义词汇
    categories['自定义'].forEach(word => {
        const wordItem = createWordItem(word, '自定义');
        wordList.appendChild(wordItem);
    });

    // 显示分类词汇
    Object.entries(categories).forEach(([category, words]) => {
        if (category !== '自定义') {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.innerHTML = `
                <div class="category-title">${category}</div>
                <div class="word-list">
                    ${words.map(word => createWordItem(word, category).outerHTML).join('')}
                </div>
            `;
            categoryList.appendChild(categoryDiv);
        }
    });
}

// 创建词汇项元素
function createWordItem(word, category) {
    const div = document.createElement('div');
    div.className = 'word-item';
    div.innerHTML = `
        <span>${word}</span>
        <button class="delete-btn" title="删除">×</button>
    `;
    
    div.querySelector('.delete-btn').addEventListener('click', () => {
        deleteWord(category, word);
    });
    
    return div;
}

// 加载设置
function loadSettings() {
    chrome.storage.sync.get({
        categories: defaultCategories,
        whitelistDomains: [],
        replacementText: DEFAULT_REPLACEMENT
    }, function(items) {
        categories = items.categories;
        document.getElementById('whitelistDomains').value = items.whitelistDomains.join('\n');
        document.getElementById('replacementText').value = items.replacementText;
        updatePreview(); // 更新预览
        updateWordList();
    });
}

// 添加更新预览的函数
function updatePreview() {
    const replacementText = document.getElementById('replacementText').value || DEFAULT_REPLACEMENT;
    const previewResult = document.querySelector('.preview-result');
    previewResult.textContent = replacementText.repeat(4); // 显示4个替换字符的效果
}

// 添加重置按钮功能
function resetToDefault() {
    if (confirm('确定要重置所有设置吗？这将删除所有自定义词汇并恢复默认替换字符。')) {
        categories = JSON.parse(JSON.stringify(defaultCategories));
        document.getElementById('replacementText').value = DEFAULT_REPLACEMENT;
        updatePreview();
        updateWordList();
        saveSettings();
    }
}

// 保存设置
function saveSettings() {
    const whitelistDomains = document.getElementById('whitelistDomains').value
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);
    
    const replacementText = document.getElementById('replacementText').value || DEFAULT_REPLACEMENT;

    chrome.storage.sync.set({
        categories: categories,
        whitelistDomains: whitelistDomains,
        replacementText: replacementText
    }, function() {
        alert('设置已保存！');
    });
} 