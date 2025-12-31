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

// Setups music toggle button and defines its behaviour
function setupMusicToggle(bgMusic) {
    let musicStopped = true;
    const musicToggle = document.getElementById('music-toggle');

    // Checks if music is currently playing and determines click action accordingly 
    musicToggle.addEventListener('click', function() {
        if (musicStopped) {
            bgMusic.pause();
            musicToggle.textContent = 'Music OFF';
            musicStopped = false;
        } else {
            bgMusic.play();
            musicToggle.textContent = 'Music ON!';
            musicStopped = true;
        }
    });

    // Return function 
    return {
        setPlaying: function(playing) {
            musicStopped = playing;
            if (playing) {
                musicToggle.textContent = 'Music ON';
            }
        }
    };
}

// Locations of the sprites
const advisorSprites = {
    bored: 'assets/sprites/bored_sprite.png',
    happy: 'assets/sprites/talking_sprite.png',
    sad: 'assets/sprites/sad_sprite.png',
    smirking: 'assets/sprites/smirk_sprite.png'
};

// Lines of each sprite
const advisorDialogue = {
    bored: [
        "Are you gonna trade or just stare at the chart?",
        "Are you trading or just window shopping?",
        "Time to yolo or go home, brokie.",
        "Tick tock, you ain't going to the moon like this.",
        "Calls on your portfolio btw."
    ],
    happy: [
        "TO THE MOON! 🚀📈🚀📈🚀📈 ",
        "This is the way! Diamond hands baby!",
        "Apes together strong! Keep it up!",
        "Cha-ching! Nice trade!",
        "That was definitely a thing of all time!"
    ],
    sad: [
        "GUH... thats gotta hurt.",
        "Paper hands got you again, huh?",
        "Welcome to the loss hall of fame champ.",
        "Your wife's boyfriend is gonna hear about this one.",
        "It's not a loss until you sell... oh wait.",
    ],
    smirking: [
        "Feeling lucky? Let's see if it pays off...",
        "Bold move. I like your style.",
        "That's some weapons-grade stupidity right there.",
        "Risky play... this better print or you're cooked.",
        "Found the next DFV or the next bag holder?"
    ]
};

// Updates the advisor based on the gamestate
function updateAdvisor(gameState) {
    let totalPnL = 0;

    // Calculate total profit/loss from all positions
    for (let i = 0; i < gameState.options.length; i++) {
        let option = gameState.options[i];
        let profitLoss = option.currentValue - option.purchasePrice;
        totalPnL += profitLoss;  // Add to the total
    }
    
    // Determine mood based on total P/L
    if (totalPnL > 4) {
        setAdvisorMood('happy'); // Big profit
    } else if (totalPnL < -4) {
        setAdvisorMood('sad'); // Big loss
    } else if (gameState.options.length > 3 && totalPnL < 0) {
        setAdvisorMood('smirking'); // Many positions
    } else {
        setAdvisorMood('bored'); // Nothing happening
    }
}

// Updates the advisor sprite and displays text
function setAdvisorMood(mood) {
    const sprite = document.getElementById('sprite-image');
    const text = document.getElementById('advisor-text');

    // Sets sprite to fit moood
    sprite.src = advisorSprites[mood];

    // Sets dialogue to a random text from proper mood
    const possibleDialogue = advisorDialogue[mood];
    const randomDialogue = possibleDialogue[Math.floor(Math.random() * possibleDialogue.length)];
    text.textContent = randomDialogue;
}

// Game over quotes
gameOverQuotes = [
    '"Sir, this is a casino."',
    '"What\'s an exit strategy?"',
    '"I am not a cat."',
    '"Funding secured."',
    '"What\'s theta decay?"',
    "'Rule No.1: Never lose money. Rule No.2: Never forget rule No.1.'",
    '"What\'s hedging?"',
    '"We like the stock"'
];

// Updates the game over screen
function showGameOver(cash, level) {
    // Update the stats and then shows the screen
    document.getElementById('final-cash').textContent = "Final Cash: " + cash.toFixed(2);
    document.getElementById('final-level').textContent = "Final Level: " + level;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('game-over-quote').textContent = gameOverQuotes[Math.floor(Math.random() * gameOverQuotes.length)];
}
