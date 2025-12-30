/*
Normal distribution functions
Source - https://stackoverflow.com/a
Posted by Steve Zelaznik, modified by community.
Retrieved 2025-12-28, License - CC BY-SA 3.0
*/

function stdNormal(z) {
    var k, m, values, total, item, z2, z4, a, b;

    // Power series is not stable at these extreme tail scenarios
    if (z < -6) { return 0; }
    if (z >  6) { return 1; }

    m      = 1;        // m(k) == (2**k)/factorial(k)
    b      = z;        // b(k) == z ** (2*k + 1)
    z2     = z * z;    // cache of z squared
    z4     = z2 * z2;  // cache of z to the 4th
    values = [];

    // Compute the power series in groups of two terms.
    // This reduces floating point errors because the series
    // alternates between positive and negative.
    for (k=0; k<100; k+=2) {
        a = 2*k + 1;
        item = b / (a*m);
        item *= (1 - (a*z2)/((a+1)*(a+2)));
        values.push(item);
        m *= (4*(k+1)*(k+2));
        b *= z4;
    }

    // Add the smallest terms to the total first that
    // way we minimize the floating point errors.
    total = 0;
    for (k=49; k>=0; k--) {
        total += values[k];
    }

    // Multiply total by 1/sqrt(2*PI)
    // Then add 0.5 so that stdNormal(0) === 0.5
    return 0.5 + 0.3989422804014327 * total;
}

/*
Black Scholes Pricing Formula
*/

// S = underlying price, K = strike, T = time, r = risk free rate,  sigma = sigma volatility, type = "call" or "put"
function blackScholes(S, K, T, r, sigma, type){

    // If option has expired then find the payoff of the intrinsic value 
    if (T <= 0){
        if (type === "call") {
            return Math.max(S - K, 0);
        } 
        else {
            return Math.max(K - S, 0);
        }
    }

    // Finds d1 and d2 for Black Scholes formula
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - (sigma * Math.sqrt(T));

    let price;

    // Determines the price of the option depending on what it's type is
    if (type === "call") {
        price = S * stdNormal(d1) - K * Math.exp(-r * T) * stdNormal(d2);
    } 
    else {
        price = K * Math.exp(-r * T) * stdNormal(-d2) - S * stdNormal(-d1);
    }

    return price;
}

/*
Geometric Brownian Motion 
Stock Price Simulator
*/

class StockSimulator {
    constructor(initialPrice = 100, sigma = 2, drift = 0) {
        this.price = initialPrice; // Set to 100 for default price
        this.sigma = sigma; // Set to 2 by default, simulates 200% volatility to match to extreme volatilty of a meme stock
        this.drift = drift; // Set to 0 by default, simulates the fact that a meme stock has no real trend, just complete randomness
    }

    tick() {
        const dt = 900 / (365 * 24 * 60 * 60) // Game will be simulating a 24/7 traded meme stock, with minutely interval
        const sigmaDrift = (this.drift - (0.5 * this.sigma * this.sigma)) * dt;
        const sigmaWiener = this.sigma * Math.sqrt(dt) * this.gaussianNormal();

        this.price = this.price * Math.exp(sigmaDrift + sigmaWiener);
        return this.price;
    }

    // Standard Normal variate using Box-Muller transform
    gaussianNormal(mean=0, stdev=1) {
        const u1 = 1 - Math.random(); // Converting [0,1) to (0,1]
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        // Transform to the desired mean and standard deviation:
        return z * stdev + mean;
    }

    getPrice() {
        return this.price;
    }
}

/*
Game Logic class that holds the game's functions
*/
class GameLogic {
    constructor() {
        this.cash = 10;
        this.level = 1;
        this.xp = 0;
        this.stock = new StockSimulator();
        this.activeOptions = [];
    }

    // Buys options
    buyOption(strike, expirySeconds, type){
        const T = expirySeconds / (365 * 24 * 60 * 60); // Annualize in-game expirySeconds for Black Scholes
        const price = blackScholes(this.stock.getPrice(), strike, T, 0.05, 2, type); // Determine price
        
        // Push object of bought optional detail into list if we can buy it
        if (this.cash >= price){
            this.cash -= price;
            this.activeOptions.push({
                strike: strike,
                timeLeft: expirySeconds,
                type: type,
                purchasePrice: price,
                currentValue: price});
            return true;
        }
        // If unable to buy it, return false
        else{
            return false;
        }
    }

    // Settles expired options
    settleOut(option){
        // Determines the payoff (uses Black Scholes function as we have a catch statement in there)
        const payoff = blackScholes(this.stock.getPrice(), option.strike, 0, 0.05, 2, option.type);
        this.cash += payoff;

        // Determines profit to see if XP should be awarded
        const profit = payoff - option.purchasePrice
            if (profit > 0){
                this.xp += Math.floor(profit * 10);
            }
    }

    // Updates logic
    tick(){
        const SEC_PER_TICK = 900;  // 8 in-game minutes per tick

        this.stock.tick(); // Update stock price 

        // Loop through all activeOptions 
        for (let i = 0; i < this.activeOptions.length; i++){
            let curOpt = this.activeOptions[i];
            curOpt.timeLeft -= SEC_PER_TICK;
            
            // Checks if current option is now expired, if so settle it
            if (curOpt.timeLeft <= 0){
                this.settleOut(curOpt);
            }
            else {
                // Finds new value of option at new time
                const newTime = curOpt.timeLeft / (365 * 24 * 60 * 60);
                curOpt.currentValue = blackScholes(this.stock.getPrice(), curOpt.strike, newTime, 0.05, 2, curOpt.type);
            }
        }

        // Removes settled option from list
        this.activeOptions = this.activeOptions.filter(curOpt => curOpt.timeLeft > 0);
    }

    // Returns the user's current status
    getUserState(){
        return {
            cash: this.cash,
            level: this.level,
            xp: this.xp,
            stockPrice: this.stock.getPrice(),
            options: this.activeOptions
        };
    }

    // Determine strike prices based on current price
    getAvailableStrikes(){
        // Gets current price of the stock
        const currentPrice = this.stock.getPrice();

        // Determines the middle strike price that will be a multiple of 5
        const middleStrike = 5 * Math.round(currentPrice / 5);

        return [middleStrike - 10, middleStrike - 5, middleStrike, middleStrike + 5, middleStrike + 10];        
    }

    // Calculates option price without purchasing it
    getOptionPrice(strike, expirySeconds, type){
        const T = expirySeconds / (365 * 24 * 60 * 60); // Annualize in-game expirySeconds for Black Scholes
        const price = blackScholes(this.stock.getPrice(), strike, T, 0.05, 2, type); // Determine price

        return price;
    }

    // Checks if the player has leveled up
    checkLevelUp(){
        // Determines the xp threshold for user's level
        const threshold = this.level * 100;

        if (this.xp >= threshold){
            this.xp -= threshold;
            this.level += 1;
        }
    }
}
