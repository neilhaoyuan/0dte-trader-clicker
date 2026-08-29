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

    const marginElement = document.getElementById('margin-status');
    const marginDebtElement = document.getElementById('margin-debt');
    if (marginElement && gameState.margin) {
        marginElement.hidden = !gameState.margin.unlocked;
        if (marginDebtElement) {
            marginDebtElement.textContent = '$' + gameState.margin.debt.toFixed(2);
        }
    }
}

function updatePerksMenu(gameState) {
    const perksList = document.getElementById('perks-list');
    if (!perksList) {
        return;
    }

    const perks = [
        { level: 2, label: 'Multi-Buy' },
        { level: 3, label: 'Better Chain' },
        { level: 4, label: 'Sell Early' },
        { level: 6, label: 'Force Refresh' },
        { level: 8, label: 'Longer Expiries' },
        { level: 10, label: 'Margin' }
    ];
    perksList.innerHTML = '';

    perks.forEach(function(perk) {
        const item = document.createElement('li');
        item.textContent = 'Lv ' + perk.level + '  ' + perk.label;
        item.className = gameState.level >= perk.level ? 'perk-unlocked' : 'perk-locked';
        perksList.appendChild(item);
    });
}

function updateQuantityControls(gameLogic) {
    const quantityInputs = [
        document.getElementById('call-quantity'),
        document.getElementById('put-quantity')
    ];
    const unlocked = gameLogic.hasPerk(2);

    quantityInputs.forEach(function(input) {
        if (!input) {
            return;
        }

        input.hidden = !unlocked;
        input.disabled = !unlocked;
        input.title = unlocked ? 'Contracts to buy' : 'Unlocks at Lv 2';
        if (!unlocked) {
            input.value = 1;
        }
    });
}

function getSelectedQuantity(inputId, gameLogic) {
    if (!gameLogic.hasPerk(2)) {
        return 1;
    }

    const input = document.getElementById(inputId);
    const quantity = Math.floor(Number(input ? input.value : 1) || 1);
    return Math.min(99, Math.max(1, quantity));
}

function formatSignedDollars(amount) {
    const sign = amount >= 0 ? '+' : '-';
    return sign + '$' + Math.abs(amount).toFixed(2);
}

function showLevelUpToasts(levelUps) {
    const toastArea = document.getElementById('toast-area');
    if (!toastArea || !levelUps || levelUps.length === 0) {
        return;
    }

    levelUps.forEach(function(levelUp) {
        const toast = document.createElement('div');
        toast.className = 'level-toast';
        const title = 'LEVEL ' + levelUp.level + (levelUp.perk ? ': ' + levelUp.perk + ' unlocked' : '');
        toast.innerHTML = '<div>' + title + '</div><div>+$' + levelUp.bonus.toFixed(2) + '</div>';
        toastArea.appendChild(toast);

        setTimeout(function() {
            toast.remove();
        }, 3600);
    });
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
    const possibleExpiry = gameLogic.getAvailableExpiries();
    const optionCount = 3;
    updateQuantityControls(gameLogic);

    // Clear out the inside of the call and put elements, prep work for new buttons
    callElements.innerHTML = '';
    putElements.innerHTML = '';

    // Generate unique call options
    for (let i = 0; i < optionCount; i++){
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
            if (gameLogic.buyOption(randomStrike, randomExpiry, 'call', getSelectedQuantity('call-quantity', gameLogic))){
                updateStatusBar(gameLogic.getUserState());
                updatePerksMenu(gameLogic.getUserState());
                updateQuantityControls(gameLogic);
                updatePositionsList(gameLogic.getUserState().options, gameLogic);
            }
        });

        callElements.appendChild(button);
    }

    // Generate unique put options
    for (let i = 0; i < optionCount; i++){
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
            if (gameLogic.buyOption(randomStrike, randomExpiry, 'put', getSelectedQuantity('put-quantity', gameLogic))){
                updateStatusBar(gameLogic.getUserState());
                updatePerksMenu(gameLogic.getUserState());
                updateQuantityControls(gameLogic);
                updatePositionsList(gameLogic.getUserState().options, gameLogic);
            }
        });

        putElements.appendChild(button);
    }
}

function updatePositionsList(options, gameLogic){
    const positionsElement = document.getElementById('positions-list');
    const activePositionsValueElement = document.getElementById('active-positions-value');
    const marginRiskElement = document.getElementById('margin-risk');
    const activePositionsValue = options.reduce(function(total, option) {
        if (option.settled) {
            return total;
        }

        const quantity = gameLogic ? gameLogic.getOptionQuantity(option) : (option.quantity || 1);
        return total + (option.currentValue * quantity);
    }, 0);

    if (activePositionsValueElement) {
        activePositionsValueElement.textContent = '$' + activePositionsValue.toFixed(2);
    }

    if (marginRiskElement && gameLogic) {
        const margin = gameLogic.getMarginState();
        marginRiskElement.hidden = !margin.unlocked || margin.debt <= 0;
        marginRiskElement.textContent = 'Equity: $' + margin.equity.toFixed(2) + ' | Required Equity: $' + margin.maintenanceRequirement.toFixed(2);
        marginRiskElement.className = margin.equity <= margin.maintenanceRequirement * 1.25 ? 'margin-risk is-danger' : 'margin-risk';
    }

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
            let profitColor;
            const quantity = gameLogic ? gameLogic.getOptionQuantity(option) : (option.quantity || 1);
            const profitLossEach = option.currentValue - option.purchasePrice;
            const profitLoss = profitLossEach * quantity;
            if (profitLoss >= 0){
                profitColor = 'green';
            }
            else{
                profitColor = 'red';
            }

            // Build the option type of the position
            const typeDiv = document.createElement('div');
            typeDiv.textContent = quantity + 'x ' + option.type.toUpperCase() + ' @ Strike $' + option.strike + (option.settled ? (option.soldEarly ? ' | SOLD' : ' | SETTLED') : '');
            positionDiv.appendChild(typeDiv);

            // Build the time remaining of the position
            const timeDiv = document.createElement('div');
            timeDiv.textContent = option.settled ? 'Final Result' : 'Time Left: ' + formatTime(option.timeLeft);
            positionDiv.appendChild(timeDiv);

            // Build purchase price
            const purchaseDiv = document.createElement('div');
            purchaseDiv.textContent = 'Paid: $' + option.purchasePrice.toFixed(2) + ' x ' + quantity + ' = $' + (option.purchasePrice * quantity).toFixed(2);
            positionDiv.appendChild(purchaseDiv);

            // Build the value of the position
            const valueDiv = document.createElement('div');
            if (option.soldEarly) {
                valueDiv.textContent = 'Sold For: $' + option.currentValue.toFixed(2) + ' x ' + quantity + ' = $' + (option.currentValue * quantity).toFixed(2);
            } else {
                valueDiv.textContent = (option.settled ? 'Value at Settlement: $' : 'Current Value: $') + option.currentValue.toFixed(2) + ' x ' + quantity + ' = $' + (option.currentValue * quantity).toFixed(2);
            }
            positionDiv.appendChild(valueDiv);

            // Build the PnL of the position
            const plDiv = document.createElement('div');
            plDiv.textContent = 'P/L: ' + formatSignedDollars(profitLoss) + ' | ' + formatSignedDollars(profitLossEach) + ' x ' + quantity;
            plDiv.style.color = profitColor;
            positionDiv.appendChild(plDiv);

            if (gameLogic && gameLogic.hasPerk(4) && !option.settled) {
                const sellButton = document.createElement('button');
                const sellPayout = roundToCents(option.currentValue * 0.85);
                sellButton.textContent = 'SELL $' + (sellPayout * quantity).toFixed(2);
                sellButton.className = 'sell-early-button';
                sellButton.addEventListener('click', function() {
                    gameLogic.sellOptionEarly(option);
                    const levelUps = gameLogic.lastLevelUps.slice();
                    const gameState = gameLogic.getUserState();
                    updateStatusBar(gameState);
                    updatePerksMenu(gameState);
                    updateQuantityControls(gameLogic);
                    showLevelUpToasts(levelUps);
                    updatePositionsList(gameState.options, gameLogic);
                });
                positionDiv.appendChild(sellButton);
            }

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
    '"Rule No.1: Never lose money. Rule No.2: Never forget rule No.1."',
    '"What\'s hedging?"',
    '"We like the stock"'
];

// Updates the game over screen
function showGameOver(cash, level, peakCash) {
    // Update the stats and then shows the screen
    document.getElementById('final-cash').textContent = "Final Cash: $" + cash.toFixed(2);
    document.getElementById('peak-cash').textContent = "Peak Cash: $" + peakCash.toFixed(2);
    document.getElementById('final-level').textContent = "Final Level: " + level;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('game-over-quote').textContent = gameOverQuotes[Math.floor(Math.random() * gameOverQuotes.length)];
    document.getElementById('score-submit-form').dataset.score = cash.toFixed(2);
    document.getElementById('score-submit-form').dataset.peakCash = peakCash.toFixed(2);
    document.getElementById('score-submit-form').dataset.level = level;
    loadLeaderboard();
}
