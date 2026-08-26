// Create game instance
let game = new GameLogic();
let previousPrice = game.stock.getPrice();
let priceHistory = [game.stock.getPrice()]; // Store price history for chart

// Background music setup
const playlist = [
    'assets/music/noodle-cove.mp3',
    'assets/music/popcorn-castle.mp3',
    'assets/music/macadamia-hills.mp3',
    'assets/music/we-were-rivals-now-were-friends.mp3'];
let currentTrack = 0;
const bgMusic = document.getElementById('bg-music');
bgMusic.volume = 0.05;

function loadTrack(index) {
    bgMusic.src = playlist[index];
    bgMusic.play();
}

// When song ends, play next one and loop once all tracks end
bgMusic.addEventListener('ended', function() {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
});

// Load UI 
window.addEventListener('DOMContentLoaded', function() {
    // Initalize all UI
    updateStatusBar(game.getUserState());
    updateStockPrice(game.stock.getPrice(), previousPrice);
    generateOptions(game);
    updatePositionsList(game.getUserState().options);
    updateAdvisor(game.getUserState());

    // Setup music toggle
    const musicControl = setupMusicToggle(bgMusic);
    
    // Start game and music after clicking start game button, load any previous saves
    document.getElementById('start-button').addEventListener('click', async function() {
        document.getElementById('start-screen').style.display = 'none';
        loadGame(game);
        await startLeaderboardSession().catch(function(error) {
            console.error(error);
        });
        loadTrack(0);
    });

    // Give up button
    document.getElementById('give-up-button').addEventListener('click', function() {
        const gameState = game.getUserState();
        localStorage.removeItem('optionsGameState'); 
        showGameOver(gameState.cash, gameState.level);
    });

    document.getElementById('leaderboard-toggle').addEventListener('click', function(event) {
        event.stopPropagation();
        const leaderboardMenu = document.getElementById('leaderboard-menu');
        leaderboardMenu.hidden = !leaderboardMenu.hidden;

        if (!leaderboardMenu.hidden) {
            loadLeaderboard();
        }
    });

    document.addEventListener('click', function(event) {
        const leaderboardMenu = document.getElementById('leaderboard-menu');
        const leaderboardToggle = document.getElementById('leaderboard-toggle');

        if (!leaderboardMenu.contains(event.target) && event.target !== leaderboardToggle) {
            leaderboardMenu.hidden = true;
        }
    });

    // Event listener that restarts the game
    document.getElementById('restart-button').addEventListener('click', function() {
        location.reload();
    });

    document.getElementById('score-submit-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = document.getElementById('submit-score-button');
        const playerName = document.getElementById('player-name').value;
        const score = Number(form.dataset.score || 0);
        const level = Number(form.dataset.level || 1);

        submitButton.disabled = true;
        setLeaderboardMessage('Submitting...');

        try {
            await submitScore(playerName, score, level);
            setLeaderboardMessage('Score submitted');
        } catch (error) {
            submitButton.disabled = false;
            setLeaderboardMessage(error.message || 'Submit failed');
            console.error(error);
        }
    });

    loadLeaderboard();

    // Create the price chart
    const chart = document.getElementById('price-chart').getContext('2d');
    const priceChart = new Chart(chart, {
        type: 'line',
        data: {
            datasets: [{
                data: priceHistory,
                borderColor: 'rgba(33, 33, 203, 1)',
                borderWidth: 4.5,
                pointRadius: 0,
                stepped: 'before',
                tension: 0,
                fill: false
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: false
            }
        }
    });
    
    // Track tick count for refreshing options
    let tickCount = 0;
    const REFRESH_INTERVAL = 10; // Refresh every 10 ticks
    
    // Start game loop - tick every 1 second (1000ms)
    setInterval(function() {        
        // Update the game state
        previousPrice = game.stock.getPrice();
        game.tick();        
        game.checkLevelUp();
        
        // Update the UI with new game state
        const gameState = game.getUserState();
        updateStatusBar(gameState);
        updateStockPrice(gameState.stockPrice, previousPrice);
        updatePositionsList(gameState.options);

        // Update advisor every 5 seconds
        if (tickCount % 7 === 0){
            updateAdvisor(gameState);
        }
        
        // Add new price to history
        priceHistory.push(gameState.stockPrice);
        
        // Keep only last 50 fetched prices
        if (priceHistory.length > 25) {
            priceHistory.shift();
        }
        
        // Update chart
        priceChart.data.labels = Array(priceHistory.length).fill('');
        priceChart.data.datasets[0].data = priceHistory;
        priceChart.update();
        
        // Update countdown
        tickCount++;
        const ticksUntilRefresh = REFRESH_INTERVAL - (tickCount % REFRESH_INTERVAL); // Determine ticks left before next refresh
        const secondsUntilRefresh = ticksUntilRefresh * 1; // 1s per tick
        document.getElementById('countdown').textContent = secondsUntilRefresh;
        
        // Refresh options every 10 ticks and change the advisor message
        if (tickCount % REFRESH_INTERVAL === 0) {
            generateOptions(game);
        }
        
    }, 1000);
});
