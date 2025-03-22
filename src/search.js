// src/search.js
(function() {
    let data = null;
    let corpus = null;
    let fuse = null;
    const searchCache = new Map();
    window.searchHistory = window.searchHistory || [];

    // 数据加载
    async function loadData() {
        try {
            const dataResponse = await fetch('/json/data.json');
            if (!dataResponse.ok) throw new Error(`Failed to load data.json: ${dataResponse.status}`);
            data = await dataResponse.json();
            console.log('JSON 数据加载成功:', data.length);

            const corpusResponse = await fetch('/json/obfuscated_corpus.json');
            if (!corpusResponse.ok) throw new Error(`Failed to load corpus: ${corpusResponse.status}`);
            const obfuscatedData = await corpusResponse.text();
            corpus = JSON.parse(decodeBase64UTF8(obfuscatedData));
            fuse = new Fuse(corpus, {
                keys: [
                    { name: 'question', weight: 0.5 },
                    { name: 'keywords', weight: 0.3 },
                    { name: 'synonyms', weight: 0.15 },
                    { name: 'tags', weight: 0.05 }
                ],
                threshold: 0.4,
                includeScore: true,
                includeMatches: true,
                minMatchCharLength: 2,
                shouldSort: true
            });
            console.log('语料库加载完成:', corpus.length);
        } catch (error) {
            console.error('数据加载失败:', error);
            const container = document.getElementById('search-container');
            if (container) container.textContent = '数据加载失败，请稍后再试';
        }
    }

    // Base64 解码
    function decodeBase64UTF8(base64Str) {
        const binaryStr = atob(base64Str);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
    }

    // JSON 数据搜索
    function searchJSON(query) {
        if (!data) return false;
        query = query.trim().toLowerCase();
        const conditions = {};
        let isSimpleQuery = false;
        let name, age;

        if (query.includes(':')) {
            query.split(',').forEach(part => {
                const [key, value] = part.split(':').map(s => s.trim());
                if (key && value !== undefined) conditions[key] = value;
            });
            name = conditions['celv'] || conditions['策略'];
            age = conditions['shoupanjia'] || conditions['收盘价'];
            if (name && age && Object.keys(conditions).length === 2) isSimpleQuery = true;
        } else if (/[，, ]/.test(query)) {
            const parts = query.split(/[，, ]+/).map(s => s.trim());
            if (parts.length === 2) {
                isSimpleQuery = true;
                if (/^\d+$/.test(parts[0])) {
                    age = parts[0];
                    name = parts[1];
                } else {
                    name = parts[0];
                    age = parts[1];
                }
                conditions['策略'] = name;
                conditions['收盘价'] = age;
            }
        } else if (/^[\u4e00-\u9fa5a-zA-Z]+\d+$/.test(query) || /^\d+[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
            isSimpleQuery = true;
            if (/^[\u4e00-\u9fa5a-zA-Z]+\d+$/.test(query)) {
                name = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
                age = query.match(/\d+/)[0];
            } else {
                age = query.match(/\d+/)[0];
                name = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
            }
            conditions['策略'] = name;
            conditions['收盘价'] = age;
        } else if (/^\d+$/.test(query)) {
            conditions['股票代码'] = query;
        } else {
            conditions[''] = query;
        }

        const matches = data.filter(row => {
            if (conditions['']) {
                return Object.values(row).some(val => 
                    String(val).toLowerCase().includes(conditions[''])
                );
            }
            return Object.entries(conditions).every(([key, value]) => {
                const rowValue = String(row[key] || '').toLowerCase();
                if (!value) return true;
                if (value.includes('-')) {
                    const [min, max] = value.split('-').map(Number);
                    const numValue = Math.floor(Number(rowValue));
                    return numValue >= min && numValue <= max;
                } else if (value.startsWith('>')) {
                    return Math.floor(Number(rowValue)) > Number(value.slice(1));
                } else if (value.startsWith('<')) {
                    return Math.floor(Number(rowValue)) < Number(value.slice(1));
                }
                if (key.toLowerCase() === '收盘价') {
                    return Math.floor(Number(rowValue)) === Math.floor(Number(value));
                }
                return rowValue === value;
            });
        });

        if (matches.length === 0) return false;

        if (!window.searchHistory.includes(query)) {
            window.searchHistory.unshift(query);
            if (window.searchHistory.length > 10) window.searchHistory.pop();
        }

        return isSimpleQuery
            ? [
                `<span class="field">全部代码:</span><br><span class="value">${matches.map(row => row['股票代码']).filter(Boolean).join(', ')}</span>`,
                `<span class="field">合计:</span> <span class="value">${matches.length}</span>`
              ]
            : matches.flatMap((result, index) => {
                const resultLines = Object.entries(result).map(([key, value]) => 
                    `<span class="field">${key}:</span> <span class="value">${value}</span>`
                );
                return index < matches.length - 1 ? [...resultLines, '<hr>'] : resultLines;
              });
    }

    // 语料库搜索
    function searchCorpus(query) {
        if (!corpus || !fuse) return '语料库未加载，请稍后再试';
        query = query.trim().toLowerCase();

        if (searchCache.has(query)) return searchCache.get(query);

        const results = fuse.search(query);
        const bestMatch = results.length > 0 && results[0].score < 0.6 ? results[0] : null;
        const intent = detectIntent(query);
        const answer = generateResponse(intent, bestMatch);
        searchCache.set(query, answer);

        if (!window.searchHistory.includes(query)) {
            window.searchHistory.unshift(query);
            if (window.searchHistory.length > 10) window.searchHistory.pop();
        }

        return answer;
    }

    // 意图检测（简化版，完整版在后续步骤）
    function detectIntent(query) {
        const intents = [
            { name: 'strategy', patterns: ['策略', '方案', '操作'] },
            { name: 'price', patterns: ['价格', '多少钱', '收盘价'] }
        ];
        return intents.find(intent => intent.patterns.some(p => query.includes(p))) || null;
    }

    function generateResponse(intent, match) {
        if (match) return match.item.answer.trim();
        if (intent) return `请 уточнить您的${intent.name}查询！`;
        return '抱歉，未找到匹配结果，请换个说法试试。';
    }

    // 初始化搜索 UI 和逻辑
    function init() {
        const container = document.getElementById('search-container');
        if (!container) return;

        container.innerHTML = `
            <input type="text" id="query-input" placeholder="输入查询">
            <button id="search-btn">搜索</button>
            <div id="result-container"></div>
        `;

        loadData();

        container.querySelector('#search-btn').addEventListener('click', () => {
            const query = container.querySelector('#query-input').value.trim();
            if (!query) return;

            const resultContainer = container.querySelector('#result-container');
            resultContainer.innerHTML = '';

            const jsonResult = searchJSON(query);
            if (jsonResult) {
                resultContainer.innerHTML = jsonResult.join('<br>');
                return;
            }

            const corpusResult = searchCorpus(query);
            resultContainer.textContent = corpusResult;
        });
    }

    // 暴露全局接口
    window.Search = {
        init,
        searchJSON,
        searchCorpus
    };
})();
