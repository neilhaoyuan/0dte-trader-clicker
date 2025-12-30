function updateStatusBar(gameState){
    // Update cash display
    const cashElement = document.getElementById('cash');
    cashElement.textContent = '$' + gameState.cash.toFixed(2);
    
    // Update level display
    const levelElement = document.getElementById('level');
    levelElement.textContent = gameState.level;
    
    // Update XP display
    const xpElement = document.getElementById('xp');
    const xpThreshold = gameState.level * 100;
    xpElement.textContent = gameState.xp + '/' + xpThreshold;
}

function updateStockPrice(newPrice, previousPrice){
    // Update displayed stock price
    const stockPrice = document.getElementById('stock-price');
    stockPrice.textContent = '$' + newPrice.toFixed(2);

    // Calculate change in price
    const change = newPrice - previousPrice;
    const changePrice = document.getElementById('stock-change');
    
    // Change the color of the changePrice depending on if its positive or negative
    if (change > 0) {
        changePrice.textContent = '+$' + change.toFixed(2);
        changePrice.style.color = 'green';
    } 
    else if (change < 0) {
        changePrice.textContent = '-$' + Math.abs(change).toFixed(2);
        changePrice.style.color = 'red';
    } 
    else {
        changePrice.textContent = '$0.00';
        changePrice.style.color = 'gray';
    }
}

function generateOptions(gameLogic){
    // Constant declarations to be used
    const availableStrikes = gameLogic.getAvailableStrikes();
    const callElements = document.getElementById('call-options');
    const putElements = document.getElementById('put-options');
    const possibleExpiry = [3600, 7200, 10800, 14400] // 1, 2, 3, adn 4 hours respectively in seconds

    // Clear out the inside of the call and put elements, prep work for new buttons
    callElements.innerHTML = '';
    putElements.innerHTML = '';

    // Generate 3 unique call options
    for (let i = 0; i < 3; i++){
        // Constructing the random call option's details
        const randomStrike = availableStrikes[Math.floor(Math.random() * availableStrikes.length)];
        const randomExpiry = possibleExpiry[Math.floor(Math.random() * possibleExpiry.length)];
        const callPrice = gameLogic.getOptionPrice(randomStrike, randomExpiry, 'call');
        
        // Skip if price is too low
        if (callPrice < 0.01) {
            i--; // Retry this iteration
            continue;
        }

        // Building the purchase button and adding click feedback that calls the options buying
        const button = document.createElement('button');
        button.textContent = 'Strike ' + randomStrike + ' | ' + (randomExpiry/3600) + ' hour | $' + callPrice.toFixed(2);
        button.addEventListener('click', function() {
            if (gameLogic.cash >= callPrice){
                gameLogic.cash -= callPrice;
                gameLogic.activeOptions.push({
                    strike: randomStrike,
                    timeLeft: randomExpiry,
                    type: 'call',
                    purchasePrice: callPrice,
                    currentValue: callPrice
                });
                updateStatusBar(gameLogic.getUserState());
                updatePositionsList(gameLogic.getUserState().options);
            }
        });

        callElements.appendChild(button);
    }

    // Generate 3 unique put options
    for (let i = 0; i < 3; i++){
        // Constructing the random call option's details
        const randomStrike = availableStrikes[Math.floor(Math.random() * availableStrikes.length)];
        const randomExpiry = possibleExpiry[Math.floor(Math.random() * possibleExpiry.length)];
        const putPrice = gameLogic.getOptionPrice(randomStrike, randomExpiry, 'put');

        // Skip if price is too low
        if (putPrice < 0.01) {
            i--; // Retry this iteration
            continue;
        }

        // Building the purchase button and adding click feedback that calls the options buying
        const button = document.createElement('button');
        button.textContent = 'Strike ' + randomStrike + ' | ' + (randomExpiry/3600) + ' hour | $' + putPrice.toFixed(2);
        button.addEventListener('click', function() {
            if (gameLogic.cash >= putPrice){
                gameLogic.cash -= putPrice;
                gameLogic.activeOptions.push({
                    strike: randomStrike,
                    timeLeft: randomExpiry,
                    type: 'put',
                    purchasePrice: putPrice,
                    currentValue: putPrice
                });
                updateStatusBar(gameLogic.getUserState());
                updatePositionsList(gameLogic.getUserState().options);
            }
        });

        putElements.appendChild(button);
    }
}

function updatePositionsList(options){
    const positionsElement = document.getElementById('positions-list');

    // If there does not exist any options, display the no options div
    if (options.length === 0){
        positionsElement.innerHTML = '<div class="no-positions">No active positions...</div>'
    }
    else{
        // If not, clear the div
        positionsElement.innerHTML = '';

        // Loop through all options and create displays for each
        for (let i = 0; i < options.length; i++){
            const option = options[i];
            const positionDiv = document.createElement('div');
            positionDiv.className = 'position-card';

            // Determine details that will be put in positionDiv
            let profitColor, profitSign;
            const profitLoss = option.currentValue - option.purchasePrice;
            if (profitLoss >= 0){
                profitColor = 'green';
                profitSign = '+';
            }
            else{
                profitColor = 'red';
                profitSign = ''
            }

            // Build the option type of the position
            const typeDiv = document.createElement('div');
            typeDiv.textContent = option.type.toUpperCase() + ' @ Strike $' + option.strike;
            positionDiv.appendChild(typeDiv);

            // Build the time remaining of the position
            const timeDiv = document.createElement('div');
            timeDiv.textContent = 'Time Left: ' + formatTime(option.timeLeft);
            positionDiv.appendChild(timeDiv);

            // Build purchase price
            const purchaseDiv = document.createElement('div');
            purchaseDiv.textContent = 'Paid: $' + option.purchasePrice.toFixed(2);
            positionDiv.appendChild(purchaseDiv);

            // Build the value of the position
            const valueDiv = document.createElement('div');
            valueDiv.textContent = 'Current Value: $' + option.currentValue.toFixed(2);
            positionDiv.appendChild(valueDiv);

            // Build the PnL of the position
            const plDiv = document.createElement('div');
            plDiv.textContent = 'P/L: ' + profitSign + '$' + profitLoss.toFixed(2);
            plDiv.style.color = profitColor;
            positionDiv.appendChild(plDiv);

            // Build the seperator 
            const sepDiv = document.createElement('div');
            sepDiv.textContent = '---------------------';
            positionDiv.appendChild(sepDiv);

            // Append this position and then move to next
            positionsElement.appendChild(positionDiv);
        }
    }
}

// Converts seconds into full time
function formatTime(seconds) {
    if (seconds < 60) {
        return Math.floor(seconds) + 's';
    } 
    else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return minutes + 'm ' + secs + 's';
    } 
    else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours + 'h ' + minutes + 'm';
    }
}