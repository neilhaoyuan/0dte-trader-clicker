// Create game instance
let game = new GameLogic();
let previousPrice = game.stock.getPrice();
let priceHistory = [game.stock.getPrice()]; // Store price history for chart

// Load UI 
window.addEventListener('DOMContentLoaded', function() {
    // Update all UI
    updateStatusBar(game.getUserState());
    updateStockPrice(game.stock.getPrice(), previousPrice);
    generateOptions(game);
    updatePositionsList(game.getUserState().options);
    
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
        
        // Refresh options every 10 ticks
        if (tickCount % REFRESH_INTERVAL === 0) {
            generateOptions(game);
        }
        
    }, 1000);
});