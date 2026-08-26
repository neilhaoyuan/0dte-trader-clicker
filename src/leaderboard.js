const SUPABASE_URL = 'https://iqcqymtmspynbndqkgmf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zIuW0QjO-GQ_mu9K5ZDqSg_90lOZPi8';
const LEADERBOARD_LIMIT = 10;
const LOCAL_LEADERBOARD_KEY = 'optionsGameLeaderboard';
const LOCAL_SESSION_KEY = 'optionsGameSessionId';

function isBackendConfigured() {
    return Boolean(
        SUPABASE_URL.indexOf('YOUR_PROJECT_ID') === -1 &&
        SUPABASE_PUBLISHABLE_KEY.indexOf('YOUR_SUPABASE_PUBLISHABLE_KEY') === -1
    );
}

function getFunctionUrl(functionName) {
    return SUPABASE_URL + '/functions/v1/' + functionName;
}

async function callLeaderboardFunction(functionName, options) {
    const response = await fetch(getFunctionUrl(functionName), {
        ...options,
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: 'Bearer ' + SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
            ...(options && options.headers ? options.headers : {})
        }
    });

    const body = await response.json().catch(function() {
        return {};
    });

    if (!response.ok) {
        throw new Error(body.error || 'Leaderboard request failed');
    }

    return body;
}

function sortScores(scores) {
    return scores.sort(function(a, b) {
        if (b.score !== a.score) {
            return b.score - a.score;
        }

        return new Date(a.created_at) - new Date(b.created_at);
    });
}

function cleanPlayerName(name) {
    return String(name || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 20) || 'DGEN';
}

function formatLeaderboardScore(score) {
    return '$' + Number(score || 0).toFixed(2);
}

function setLeaderboardMessage(message) {
    const messageElement = document.getElementById('leaderboard-message');
    const submitStatus = document.getElementById('score-submit-status');

    if (messageElement) {
        messageElement.textContent = message;
    }

    if (submitStatus) {
        submitStatus.textContent = message;
    }
}

function renderLeaderboard(scores) {
    const lists = [
        document.getElementById('leaderboard-list'),
        document.getElementById('game-over-leaderboard')
    ].filter(Boolean);

    lists.forEach(function(list) {
        list.innerHTML = '';

        if (!scores.length) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'No scores yet';
            list.appendChild(emptyItem);
            return;
        }

        scores.forEach(function(score, index) {
            const item = document.createElement('li');
            const rank = document.createElement('span');
            const name = document.createElement('span');
            const level = document.createElement('span');
            const amount = document.createElement('span');

            rank.textContent = '#' + (index + 1);
            name.textContent = score.player_name;
            level.textContent = 'Lv ' + Number(score.level || 1);
            amount.textContent = formatLeaderboardScore(score.score);
            item.appendChild(rank);
            item.appendChild(name);
            item.appendChild(level);
            item.appendChild(amount);
            list.appendChild(item);
        });
    });
}

async function loadLeaderboard() {
    if (!isBackendConfigured()) {
        const localScores = JSON.parse(localStorage.getItem(LOCAL_LEADERBOARD_KEY) || '[]');
        renderLeaderboard(sortScores(localScores).slice(0, LEADERBOARD_LIMIT));
        setLeaderboardMessage('Local test leaderboard');
        return;
    }

    setLeaderboardMessage('Loading ranks...');

    try {
        const result = await callLeaderboardFunction('leaderboard', { method: 'GET' });
        renderLeaderboard(result.scores || []);
        setLeaderboardMessage('');
    } catch (error) {
        renderLeaderboard([]);
        setLeaderboardMessage('Leaderboard unavailable');
        console.error(error);
    }
}

async function startLeaderboardSession() {
    if (!isBackendConfigured()) {
        const localSessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
        localStorage.setItem(LOCAL_SESSION_KEY, localSessionId);
        return localSessionId;
    }

    const result = await callLeaderboardFunction('start-game', { method: 'POST', body: '{}' });
    localStorage.setItem(LOCAL_SESSION_KEY, result.sessionId);
    return result.sessionId;
}

async function submitScore(playerName, score, level, peakCash) {
    if (!isBackendConfigured()) {
        const localScores = JSON.parse(localStorage.getItem(LOCAL_LEADERBOARD_KEY) || '[]');

        localScores.push({
            player_name: cleanPlayerName(playerName),
            score: Number(score.toFixed(2)),
            peak_cash: Number((peakCash || score).toFixed(2)),
            level: level,
            created_at: new Date().toISOString()
        });

        localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(sortScores(localScores)));
        await loadLeaderboard();
        return;
    }

    const sessionId = localStorage.getItem(LOCAL_SESSION_KEY);

    if (!sessionId) {
        throw new Error('Start a new run before submitting a score.');
    }

    await callLeaderboardFunction('submit-score', {
        method: 'POST',
        body: JSON.stringify({
            sessionId,
            playerName: cleanPlayerName(playerName),
            score: Number(score.toFixed(2)),
            peakCash: Number((peakCash || score).toFixed(2)),
            level: level
        })
    });
    localStorage.removeItem(LOCAL_SESSION_KEY);
    await loadLeaderboard();
}
