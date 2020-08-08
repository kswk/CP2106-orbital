// REPLACE SCRIPTS BLOCK UNDER "main": "index.js", in package.json file

// FOR LOCAL TEST PACKAGE.JSON
// "scripts": {
//   "test": "echo \"Error: no test specified\" && exit 1"
// },

// FOR HEROKU PACKAGE.JSON
// "scripts": {
//     "start": "micro-bot"
//     },



// FOR HEROKU

const { Composer } = require('micro-bot');
const bot = new Composer;
module.exports = bot;

bot.init = async (mBot) => {
    bot.telegram = mBot.telegram;
}

// FOR HEROKU


// FOR LOCAL TEST

// const Telegraf = require('telegraf');
// const bot = new Telegraf('[INSERT TELEGRAM BOT TOKEN HERE]');
// bot.launch();

// FOR LOCAL TEST

// ###################################################################### GENERIC BOT COMMANDS ###################################################################################
// ###############################################################################################################################################################################

bot.start((ctx) => {
    ctx.reply("Welcome to CardBot Box! Type /choosegame to choose a game to play, or /help for an introduction to this bot!")
})

bot.command("choosegame", (ctx) => {
    if (gameInfo.hosted) {
        ctx.reply("There's already a game in progress, wait for it to end first.");
    } else {
        bot.telegram.sendMessage(ctx.chat.id, 'Which game would you like to play?',
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'UNO', callback_data: 'uno' },
                            { text: 'Blackjack', callback_data: 'blackjack' }
                        ],
                        [
                            { text: 'Poker', callback_data: 'poker' }
                        ]
                    ]
                }
            });
        gameInfo.chatid = ctx.chat.id;
    }
})

bot.help((ctx) => {
    ctx.reply(
        `NOTE: This bot is meant to be used in a Telegram group with your friends.

Welcome to CardBox Bot, where you can play card games with your friends over Telegram! Type /choosegame to choose a game to play!
This bot will effectively simulate an entire round of card games within Telegram itself, allowing you to play without needing to have the actual cards on hand. Currently, Blackjack and Poker are available. 
Do note that several gameplay phases will require the game's host or the dealer to initiate them using commands. Don't worry, I'll prompt you when you need to do so!

Some helpful commands:
/choosegame: Select a game to play
/settings: Change some settings of the game, used only by game hosts
/mymoney: View your current bet and money
/bet <amount>: Set your current bet to the given amount. Only used for Blackjack.
/raise <amount>: Raises your bet to the given amount. Only used for Poker, and only when prompted.
/join: Joins the current game lobby
/leavegame: Leaves the current game session. Can only be done before a game starts.
/kickplayer <username>: Boots the player from the lobby. Can only be done before a game starts.
/startgame: Starts the game, used only by game hosts
/endgame: Ends a game immediately, used only by game hosts
/info: Displays some information about the current game/lobby

About money:
- You can set the amount you want to bet using /bet <amount>, and view your current bet and credits using /mymoney.
- All bets will be locked in only when the cards are dealt for Blackjack, and the credits will be deducted from your wallet.
- For Poker, due to the nature of the game, betting works differently. I (the bot) will send you a private message for you to choose what to do.
- Leaving a lobby will also reset the amount of credits you have in your wallet to the default amount.

Disclaimer: Credits here are 100% virtual and have no intention of encouraging gambling.`);
})

bot.settings((ctx) => {
    changingPlayers = false;
    changingMoney = false;
    if (!gameInfo.hosted) {
        ctx.reply("Start a game lobby using /choosegame first!");
    } else if (!verifyHost(ctx.from)) {
        ctx.reply("Sorry, you need to be a game host to use this command.");
    }
    else if (gameInfo.started) {
        ctx.reply("Sorry, the game has already started!");
    } else {
        bot.telegram.sendMessage(ctx.chat.id, "What setting would you like to change?", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Max Players', callback_data: 'change_players' },
                        { text: 'Change game', callback_data: 'change_game' }
                    ],
                    [
                        { text: 'Default Money', callback_data: 'change_money' }
                    ]
                ]
            }
        });
    }
})

bot.command("credits", (ctx) => {
    ctx.reply(`CardBot Box is a Computer Science project for the National University of Singapore's module CP2106 (Independent Software Development Project), better known as Orbital. It was undertaken during the summer holidays of AY19/20.
    
Developers: 
- Tan Jia Wei, Joe
- Kenny Seet Wen Kai

Langauge used: JavaScript

Tech Stack used:
1. Telegram API
2. Telegraf Framework
3. Node.js
4. Heroku
5. BotFather (@BotFather)`);
})

bot.action('uno', (ctx) => {
    ctx.deleteMessage();
    bot.telegram.sendMessage(ctx.chat.id, "This game is in development, come back another time!", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Blackjack', callback_data: 'blackjack' },
                    { text: 'Poker', callback_data: 'poker' }
                ]
            ]
        }
    });
    // gameInfo.host = ctx.from;
    // players.numPlayers = players.numPlayers + 1;
    // players.playerArr.push(ctx.from);
    // ctx.reply('You have started a game of UNO! Other players can type /join to join the game!');
})

bot.action('poker', (ctx) => {
    ctx.deleteMessage();
    makeDeck();
    currentGame = "Poker";
    gameInfo.hosted = true;
    players.numPlayers++;
    ctx.from.cards = [];
    ctx.from.bet = 0;
    ctx.from.money = gameInfo.defaultMoney; 
    players.playerArr.push(ctx.from);
    gameInfo.host = ctx.from.id;
    // Poker specific
    ctx.from.fold = false;
    ctx.from.bestHand = "";
    ctx.from.ranking = -1;
    ctx.from.handHighestCard = -1;
    ctx.from.broke = false;
    ctx.reply(`${ctx.from.first_name} has started a game of Poker.
Other players can type /join to join the game, up to a maximum of ${gameInfo.maxPlayers - 1} more. When ready, type /startgame to start the round!

For players who have never used me before, please send a message to me (the bot) first as I am not allowed to start a conversation with you. Please do it now, this is important!`);
})

bot.action('blackjack', (ctx) => {
    ctx.deleteMessage();
    makeDeck(); // creates the deck of cards
    currentGame = "Blackjack";
    gameInfo.hosted = true;
    players.numPlayers++;
    ctx.from.cards = [];
    ctx.from.bet = 0;
    ctx.from.money = gameInfo.defaultMoney;
    players.playerArr.push(ctx.from);
    gameInfo.host = ctx.from.id; // keeps track of the game's host
    // Blackjack specific
    ctx.from.bust = false;
    ctx.from.stand = false;
    ctx.from.blackjack = false;
    ctx.from.numAces = 0;
    ctx.from.sum = 0;
    ctx.from.oneAceSum = ctx.from.sum + 10;
    ctx.reply(`${ctx.from.first_name} has started a game of Blackjack.
Other players can type /join to join the game, up to a maximum of ${gameInfo.maxPlayers - 1} more. When ready, type /startgame to start the round!

For players who have never used me before, please send a message to me (the bot) first as I am not allowed to start a conversation with you. Please do it now, this is important!

*Note: Due to development issues, splitting a hand is currently unimplemented`);
})

bot.command("join", (ctx) => {
    if (!gameInfo.hosted) {
        ctx.reply("There isn't a game hosted yet! Use /choosegame to host one!");
    } else if (gameInfo.started == true) {
        ctx.reply("The game has already started! Sorry!");
    } else if (gameInfo.maxPlayers == players.numPlayers) {
        ctx.reply("Sorry, the maximum number of players has been reached!");
    } else {
        for (p of players.playerArr) { // checking if player is already in the game lobby
            if (ctx.from.id == p.id) {
                ctx.reply("You're already in the lobby!");
                return;
            }
        }
        if (currentGame == "Blackjack") {
            ctx.from.bust = false;
            ctx.from.stand = false;
            ctx.from.blackjack = false;
            ctx.from.numAces = 0;
            ctx.from.sum = 0;
            ctx.from.oneAceSum = ctx.from.sum + 10
        } else if (currentGame == "Poker") {
            ctx.from.fold = false; // 
            ctx.from.bestHand = ""; // The best possible hand the player has
            ctx.from.ranking = -1; // Used to compare hands at the end of the game
            ctx.from.handHighestCard = -1;
            ctx.from.broke = false;
        }
        players.numPlayers++;
        ctx.from.cards = []; // creates the array of cards for the player
        ctx.from.bet = 0; // current amount of money the player is betting
        ctx.from.money = gameInfo.defaultMoney; // amount of money the player has in their wallet
        players.playerArr.push(ctx.from);
        ctx.reply(`${ctx.from.first_name} has joined the game. Up to ${gameInfo.maxPlayers - players.numPlayers} more can join.`);
    }
})

// Allows a player to leave the game before it starts if they want
bot.command("leavegame", (ctx) => {
    if (gameInfo.started) {
        ctx.reply("The game has already started. The host needs to end the game using /endgame first.");
    } else {
        for (i = 0; i < players.playerArr.length; i++) {
            if (players.playerArr[i].id == ctx.from.id) {
                let leaving = players.playerArr[i]; // the player that wants to leave
                players.playerArr.splice(i, 1); // remove the player from the playerArr, effectively kicking him out of the game
                players.numPlayers--;
                ctx.reply("You have successfully left the game. Goodbye!")

                // if the player happened to be the host,
                // select a new host by random
                if (leaving.id == gameInfo.host) {
                    let rng = Math.floor(Math.random() * players.numPlayers);
                    let newHost = players.playerArr[rng];
                    gameInfo.host = newHost.id;
                    ctx.reply("The host left the game! " + newHost.first_name + " is now the new host!");
                }
                return; // end the loop
            }
        }
        ctx.reply("You're not currently in a game lobby!");
    }
})

// Kicks someone
bot.command("kickplayer", (ctx) => {
    if (!gameInfo.hosted) {
        ctx.reply("There isn't a game lobby right now.");
    } else if (verifyHost(ctx.from)) {
        const text = ctx.update.message.text;
        const playerName = text.split(' ')[1];
        if (gameInfo.started) { // game has already started
            ctx.reply("The game has already started, sorry!");
        } else if (playerName === undefined) { // user entered a blank field
            ctx.reply("Please enter the username of the player you want to kick!");
        } else if (("@" + ctx.from.username) == playerName) { // user tries to kick themselves
            ctx.reply("You can't kick yourself! Use /leavegame if you want to.");
        } else {
            // searching for the player
            let count = 0;
            for (p of players.playerArr) {
                if (("@" + p.username) == playerName) {
                    // kick the player from the game
                    resetPlayer(p);
                    ctx.reply(`${p.first_name} has been kicked from the game by the host.`);
                    players.playerArr.splice(count, 1);
                    players.numPlayers--;
                    return;
                }
                count++;
            }
            // If username isn't found in the player array
            ctx.reply("That player isn't in the game! If the player does not have a Telegram username, then due to the limitations of Telegram API, this command unfortunately can't be used.");
        }
    } else {
        ctx.reply("Only the host can use this command, sorry!");
    }
})

// starts the game and stops others from joining
bot.command("startgame", (ctx) => {
    if (verifyHost(ctx.from)) {
        if (players.numPlayers < 2) {
            ctx.reply("You need at least 2 players to start the game!");
            return;
        } else {
            if (currentGame == "Blackjack") {
                ctx.reply(`The game has been started by the host! Players are no longer able to join.
The host now needs to select a dealer using /selectdealer <username>.`);
            } else if (currentGame == "Poker") {
                ctx.reply("The game has been started by the host! Players are no longer able to join.");
                setTimeout(() => initialBets(), 1000);
                setTimeout(() => dealCardsPoker(), 2000);
            }
            gameInfo.started = true;
        }
    } else {
        ctx.reply("Only the host can use this command, sorry!");
    }
})

bot.command("endgame", (ctx) => {
    if (!gameInfo.hosted) {
        ctx.reply("There isn't a game lobby right now.");
    } else {
        if (verifyHost(ctx.from)) {
            ctx.reply("The game has been ended by the host! Thanks for playing!");
            reset();
        } else {
            ctx.reply("Only the host can use this command, sorry!");
        }
    }
})

// Display information about the game
bot.command("info", (ctx) => {
    let newArr = players.playerArr.map(x => x.first_name);
    ctx.reply(`Current game: ${currentGame}
Max Players: ${gameInfo.maxPlayers}
Current players: ${newArr.length == 0 ? "Nobody" : newArr.join(", ")}
Dealer: ${currentGame == "Blackjack" ? players.dealer.first_name : "N/A"}
Pot: ${currentGame == "Poker" ? pot : "N/A"}
Whose turn is it: ${!gameInfo.started ? "N/A" : newArr[gameInfo.turnCounter]}`);
})

// Tell the player how much money he has
bot.command("mymoney", (ctx) => {
    if (ctx.from.id == players.dealer.id) {
        ctx.reply(`Current bet: N/A
Current amount in wallet: ${players.dealer.money}`);
    } else {
        for (p of players.playerArr) {
            if (ctx.from.id == p.id) {
                ctx.reply(`Current bet: ${p.bet}
Current amount in wallet: ${p.money}`);
                return;
            }
        }
        // Evaluated only if the player is not found in the playerArr
        ctx.reply("You're not in a game lobby!");
    }
})

// Lets players bet in blackjack
// Only sets the value of the player's bet as a tentative value, which is locked in only when confirmBets is called (in /dealCards)
bot.command("bet", (ctx) => {
    if (currentGame == "Blackjack") {
        if (players.dealer.id == "null") {
            ctx.reply("Please select a dealer first!");
        } else if (BJGamePhases.cardsDealt ) {
            ctx.reply("The cards have already been dealt! You can't bet now.");
        } else if (verifyDealer(ctx.from)) {
            ctx.reply("You're the dealer, you can't bet.");
        } else {
            const msg = ctx.update.message.text;
            const amt = parseInt(msg.split(' ')[1]);
            if (isNaN(amt) || amt < 0) {
                ctx.reply("Please enter a valid number!");
            } else {
                for (p of players.playerArr) {
                    if (p.id == ctx.from.id) {
                        p.bet = amt;
                        break;
                    }
                }
                ctx.reply(`You have set your bet to ${amt}.`);
            }
        }
    } else if (currentGame == "Poker") {
        ctx.reply("This command is not usable in Poker, sorry!");
    } else {
        ctx.reply("Please select a game first!");
    }
})

// Used for changing players
bot.action("change_players", (ctx) => {
    ctx.deleteMessage();
    ctx.reply("Ok, enter the new max number of players.");
    changingPlayers = true;
})

// Used for changing default money
bot.action("change_money", (ctx) => {
    ctx.deleteMessage();
    ctx.reply("Ok, enter the new default money amount.");
    changingMoney = true;
})

// Quits the game completely, hard reset
bot.action("quit", (ctx) => {
    ctx.deleteMessage();
    reset();
    ctx.reply("The lobby has been reset. Use /choosegame to select a new game to play. Thanks for playing!");
})

bot.action("change_game", (ctx) => {
    if (verifyHost(ctx.from)) {
        bot.telegram.sendMessage(gameInfo.chatid, "Which game would you like to change to?", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: "UNO", callback_data: "chg_uno"},
                        {text: "Blackjack", callback_data: "chg_bj"}
                    ],
                    [
                        {text: "Poker", callback_data: "chg_poker"}
                    ]
                ]
            }
        })
    } else {
        ctx.reply("Only the host can do this, sorry!");
    }
})

bot.action("chg_uno", (ctx) => {
    ctx.reply("This game is still in progress, come back another time!");
})

bot.action("chg_bj", (ctx) => {
    if (verifyHost(ctx.from)) {
        if (currentGame == "Blackjack") {
            ctx.reply("This is already the current game!");
        } else {
            ctx.deleteMessage();
            currentGame == "Blackjack";
            bot.telegram.sendMessage(gameInfo.chatid, "The host has changed the lobby to a Blackjack lobby.");
            // Adding Blackjack attributes to all players
            for (p of players.playerArr) {
                p.bust = false;
                p.stand = false;
                p.blackjack = false;
                p.numAces = 0;
                p.sum = 0;
                p.oneAceSum = ctx.from.sum + 10;
            }
        }
    } else {
        ctx.reply("Only the host can do this, sorry!");
    }
})

bot.action("chg_poker", (ctx) => {
    if (verifyHost(ctx.from)) {
        if (currentGame == "Poker") {
            ctx.reply("This is already the current game!");
        } else {
            ctx.deleteMessage();
            currentGame == "Poker";
            bot.telegram.sendMessage(gameInfo.chatid, "The host has changed the lobby to a Poker lobby.");
            // Adding Poker attributes to all players
            for (p of players.playerArr) {
                p.fold = false;
                p.bestHand = "";
                p.ranking = -1;
                p.handHighestCard = -1;
                p.broke = false;
            }
        }
    } else {
        ctx.reply("Only the host can do this, sorry!");
    }
})

// ###################################################################### GENERIC GAME OBJECTS #####################################################################################
// #################################################################################################################################################################################

var changingPlayers = false;
var changingMoney = false;

// Object to encapsulate information about the game
var gameInfo = {
    hosted: false,
    started: false,
    turnCounter: 0,
    host: 0,
    chatid: 0,
    maxPlayers: 8,
    defaultMoney: 500
}

// Object to encapsulate information about the game's players
var players = {
    playerArr: [],
    numPlayers: 0,
    dealer: {
        first_name: "null",
        username: "null",
        id: "null"
    }
}

// What the current game mode is
var currentGame = "No game";

// Object to encapsulate information about the current deck of cards
var deck = {
    numTotal: 52,
    cards: []
}

// ##################################################################### GENERIC MISC FUNCTIONS ############################################################################
// #########################################################################################################################################################################

// draws a card from the top of the deck (which should be randomised already)
function drawCard() {
    deck.numCards--;
    let card = deck.cards.shift();
    return card;
}

// functions to get the info of the card 
function value(card) {
    if (currentGame == "Blackjack") { // special case for blackjack
        if (typeof card[0] == "string") {
            return 10; // if the card is a picture card, its value = 10
        } else {
            return card[0];
        }
    } else { // case for poker
        return card[0];
    }
}

function demap(number) {
    if (number == 13) {
        return "King";
    } else if (number == 12) {
        return "Queen";
    } else if (number == 11) {
        return "Jack";
    } else if (number == 14 && currentGame == "Poker") {
        return "Ace";
    } else {
        return number;
    }
}

// function to get the actual value of the card, instead of just the name. Useful for picture cards
function trueValue(card) {
    if (typeof value(card) == "number") {
        if (isAce(card) && currentGame == "Poker") {
            return 14; // Ace is biggest in Poker
        } else {
            return value(card);
        }
    } else {
        if (value(card) == "Jack") {
            return 11;
        } else if (value(card) == "Queen") {
            return 12;
        } else {
            return 13;
        }
    }
}

function suit(card) {
    return card[1];
}
function isAce(card) { // checks whether the card is an ace
    return card[0] == 1;
}

// Verifies that the player using a command is the host
function verifyHost(player) {
    return player.id == gameInfo.host;
}

function verifyGame(name) {
    if (currentGame != name) {
        bot.telegram.sendMessage(gameInfo.chatid, `This is the wrong game to use this command! The current game is: ${currentGame}.`);
        return;
    }
}

// resets information for one specific player
function resetPlayer(player) {
    player.bust = false;
    player.blackjack = false;
    player.stand = false;
    player.numAces = 0;
    player.sum = 0;
    player.oneAceSum = 0;
    player.cards = [];
    player.bet = 0;
    player.fold = false;
    player.broke = false;
    player.bestHand = "";
    player.ranking = -1;
    player.handHighestCard = -1;
}

// resets the game
function reset() {
    // resetting states
    changingPlayers = false;
    changingMoney = false;
    gameInfo.hosted = false;
    gameInfo.started = false;
    gameInfo.turnCounter = 0;
    gameInfo.host = 0;
    currentGame = "No game";
    // FOR BLACKJACK
    BJGamePhases.cardsDealt = false;
    BJGamePhases.playersFinished = false;
    BJGamePhases.dealerFinished = false;
    // FOR POKER
    pokerGamePhases.currentCardPhase = 0;
    pot = 0;
    table = [];
    currentHighestBet = 0;
    lastRaised = "null";
    numFolded = 0;
    raising = false;

    // resetting players
    if (currentGame == "Blackjack") {
        players.playerArr.push(players.dealer);
        players.dealer = {
            first_name: "null",
            username: "null",
            id: "null"
        }
    }
    for (p of players.playerArr) {
        resetPlayer(p);
    }
    
    players.playerArr = [];
    players.numPlayers = 0;
    deck.numTotal = 52;
    deck.cards = [];
}

// reset to be used when a lobby is "restarted" after a previous game
function softReset() {
    // resetting states
    changingPlayers = false;
    changingMoney = false;
    gameInfo.started = false;
    gameInfo.turnCounter = 0;
    // FOR BLACKJACK
    BJGamePhases.cardsDealt = false;
    BJGamePhases.playersFinished = false;
    BJGamePhases.dealerFinished = false;
    // FOR POKER
    pokerGamePhases.currentCardPhase = 0;
    pot = 0;
    table = [];
    currentHighestBet = 0;
    lastRaised = "null";
    numFolded = 0;
    raising = false;

    // resetting players
    if (currentGame == "Blackjack") {
        players.playerArr.push(players.dealer);
        players.dealer = {
            first_name: "null",
            username: "null",
            id: "null"
        }
    }
    for (p of players.playerArr) {
        resetPlayer(p);
    }
    deck.numTotal = 52;
    deck.cards = [];
}

// Function to shuffle an array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        let t = array[i];
        array[i] = array[j];
        array[j] = t
    }
}

// privately sends the player's hand to them via text message
function sendHand(player) {
    const hand = player.cards.map(x => x.join(" of "));
    if (player.numAces > 0) {
        bot.telegram.sendMessage(player.id, `Here is your current hand:
${hand.join("\n")}
${currentGame == "Blackjack" ? `with a total value of ${player.sum}.` : ""}`);
    } else {
        bot.telegram.sendMessage(player.id, `Here is your current hand: 
${hand.join("\n")}
${currentGame == "Blackjack" ? `with a total value of ${player.sum}, ${player.oneAceSum} accounting for aces.` : ""}`);
    }
}

// reveals all the cards of the input player
function revealCards(player) {
    let playercards = player.cards.map(x => x.join(" of "));
    if (player.numAces < 1) {
        bot.telegram.sendMessage(gameInfo.chatid, `${player.first_name}'s cards are:
${playercards.join("\n")}
${currentGame == "Blackjack" ? `with a total value of ${player.sum}.` : ""}`);
    } else {
        bot.telegram.sendMessage(gameInfo.chatid, `${player.first_name}'s cards are: 
${playercards.join("\n")} 
${currentGame == "Blackjack" ? `with a total value of ${player.sum}, ${player.oneAceSum} accounting for aces.` : ""}`);
    }
}

// Used to confirm the player's bets
// Using /bet only sets a tentative value, which is confirmed only when this function is used.
function confirmBets(player) {
    player.money -= player.bet;
}

// function to make the sort() function actually work properly
function properSort(a,b) {
    return a - b;
}

// ########################################################################## BLACKJACK ####################################################################################
// #########################################################################################################################################################################

/* GAME FLOW:
    1. Let players join 
    2. Make and shuffle the deck 
    3. Select the dealer 
    4. Deal the first cards 
    5. Check for Blackjacks --> dealer blackjack > player blackjack
    6. Hit/Stand gameplay
    7. End of round: Reveal all cards and compare
   THINGS TO NOTE FOR: (Rules taken from hitorstand.net)
    1. Accounting for aces --> 1 or 11
    2. Ignore suits
    3. 11, 12, 13 = 10 --> Picture cards all worth 10 only
    4. Dealer must stand at 17 or above
    5. Players cards are revealed, dealer has one card hidden
    6. Double down
    7. Split
*/

// Object to keep track of which phase of the blackjack game you're currently in
var BJGamePhases = {
    cardsDealt: false,
    playersFinished: false,
    dealerFinished: false
}

// ###################################################################### BLACKJACK BOT COMMANDS ###################################################################################
// #################################################################################################################################################################################

// deals the first set of cards to players, and reveals them. Reveals one of the dealer's cards
bot.command("dealcards", (ctx) => {
    verifyGame("Blackjack");
    if (!gameInfo.started) { // checking that the dealer has been selected
        ctx.reply("Please start the game first!");
    } else if (BJGamePhases.cardsDealt) {
        ctx.reply("The cards have already been dealt!");
    } else {
        if (verifyDealer(ctx.from)) {
            for (p of players.playerArr) {
                confirmBets(p);
            }
            // dealing cards
            dealCards();
            BJGamePhases.cardsDealt = true;
            // revealing cards
            let x = 0;
            for (p of players.playerArr) {
                revealCards(p);
            }
            x += 1000
            setTimeout(() => revealCardsDealer(), x);
            x += 1000;

            // check if anyone got a blackjack
            setTimeout(() => checkBJ(), x)
            x += 1000;
            setTimeout(() => ctx.reply("The cards have now been dealt! The host now needs to use /play to initiate the gameplay phase."), x);
        } else {
            ctx.reply("Only the dealer can use this command, sorry!");
        }
    }
})

// Selects a dealer manually
bot.command("selectdealer", (ctx) => {
    verifyGame("Blackjack");
    if (!gameInfo.started || !gameInfo.hosted) {
        ctx.reply("There isn't a game in progress now.")
    } else if (verifyHost(ctx.from)) {
        if (players.dealer.first_name != "null") {
            ctx.reply("A dealer has already been chosen.");
        } else {
            const msg = ctx.update.message.text;
            const un = msg.split(' ')[1];
            let count = 0;
            for (p of players.playerArr) {
                if ("@" + p.username == un) {
                    players.dealer = p;
                    players.playerArr.splice(count, 1);
                    bot.telegram.sendMessage(players.dealer.id, "You are the dealer! Everyone will be fighting against you!");
                    ctx.reply(`${p.first_name} has been appointed as the dealer, and can now use /dealcards to deal the cards to the players. Make sure everyone has confirmed their bets first!`);
                    setTimeout(() => ctx.reply("Non-dealer players, be reminded to use /bet <amount> to state the amount of money you want to bet! (default amount is zero)"), 1000);
                    return;
                }
                count++;
            }
            ctx.reply("There isn't a player with that username in the game!");
        }
    } else {
        ctx.reply("Only the host can use this command, sorry!");
    } 
})

bot.command("play", (ctx) => {
    verifyGame("Blackjack");
    if (!gameInfo.hosted) {
        ctx.reply("There isn't a game in progress now.")
    } else if (!BJGamePhases.cardsDealt) {
        ctx.reply("The cards haven't been dealt yet!");
    } else if (verifyHost(ctx.from)) {
        turnProgBJ(gameInfo.turnCounter);
    }
    else {
        ctx.reply("Only the host can use this command, sorry!");
    }
})

bot.command("dealersturn", (ctx) => {
    verifyGame("Blackjack");
    if (verifyDealer(ctx.from)) {
        executeDealer();
    } else {
        ctx.reply("Only the dealer can use this command, sorry!");
    }
})

bot.command("comparecards", (ctx) => {
    verifyGame("Blackjack");
    if (verifyHost(ctx.from)) {
        if (!BJGamePhases.dealerFinished) {
            ctx.reply("The players haven't finished their turns yet!");
        } else {
            compareCards();
        }
    } else if (!gameInfo.started || !gameInfo.hosted) {
        ctx.reply("There isn't a game in progress right now.")
    } else {
        ctx.reply("Only the host can use this command, sorry!");
    }
})

// Player chooses to hit
bot.action("hit", (ctx) => {
    ctx.deleteMessage();
    let drawnCard = drawCard();
    let currentPlayer = players.playerArr[gameInfo.turnCounter]
    currentPlayer.cards.push(drawnCard);
    bot.telegram.sendMessage(gameInfo.chatid, currentPlayer.first_name + " hits and draws a " + drawnCard.join(" of "));
    updateSum(currentPlayer);
    sendHand(currentPlayer);
    setTimeout(() => revealCards(currentPlayer), 1000);
    if (checkBust(currentPlayer)) {
        currentPlayer.bust = true;
        setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, currentPlayer.first_name + " has gone bust! Too bad!"), 1500);
        gameInfo.turnCounter++;
        // proceeds to the next player's turn after the previous player is done with their turn
        setTimeout(() => turnProgBJ(gameInfo.turnCounter), 2500);
    } else {
        setTimeout(() => playerActionBJ(currentPlayer), 2500);
    }
})

// Player chooses to stand
bot.action("stand", (ctx) => {
    ctx.deleteMessage();
    let currentPlayer = players.playerArr[gameInfo.turnCounter]
    currentPlayer.stand = true;
    bot.telegram.sendMessage(gameInfo.chatid, currentPlayer.first_name + " chooses to stand.");
    gameInfo.turnCounter++;
    // proceeds to the next player's turn after the previous player is done with their turn
    setTimeout(() => turnProgBJ(gameInfo.turnCounter), 1000);
})

// Player chooses to double down
// Can only draw one more card, bet is doubled
bot.action("double", (ctx) => {
    let currentPlayer = players.playerArr[gameInfo.turnCounter]
    if (currentPlayer.cards.length > 2) {
        bot.telegram.sendMessage(currentPlayer.id, "You're not allowed to double down after taking a turn.");
    } else {
        ctx.deleteMessage();
        ctx.from.money -= ctx.from.bet;
        ctx.from.bet *= 2;
        let drawnCard = drawCard();
        currentPlayer.cards.push(drawnCard); // player draws the card
        bot.telegram.sendMessage(gameInfo.chatid, currentPlayer.first_name + " doubles down and draws a " + drawnCard.join(" of"));
        currentPlayer.stand = true; // have to stand after doubling
        updateSum(currentPlayer);
        sendHand(currentPlayer);
        setTimeout(() => revealCards(currentPlayer), 1000);
        if (checkBust(currentPlayer)) {
            currentPlayer.bust = true;
            setTimeout(bot.telegram.sendMessage(gameInfo.chatid, currentPlayer.first_name + " has gone bust! Too bad!"), 1500);
        }
        gameInfo.turnCounter++;
        // proceeds to the next player's turn after the previous player is done with their turn
        setTimeout(() => turnProgBJ(gameInfo.turnCounter), 2500);
    }
})

// Used to restart a lobby of blackjack
bot.action("blackjack2", (ctx) => {
    softReset();
    ctx.deleteMessage();
    makeDeck(); // recreates the deck of cards
    gameInfo.host = ctx.from.id; // assign new host
    ctx.reply(`The game has been restarted with ${ctx.from.first_name} as the new host. When ready, type /startgame to start the round!`);
})


// ##################################################################### BLACKJACK MISC FUNCTIONS ###############################################################################
// ##############################################################################################################################################################################

// Verifies that the player using a command is the dealer
function verifyDealer(player) {
    return player.id == players.dealer.id;
}

// check for blackjack
// Blackjack is only possible with an Ace, so can just check ace sums
function checkBJ() {
    // check dealer then check players
    let dealer = players.dealer;
    if (dealer.oneAceSum == 21) {
        // checking dealer
        bot.telegram.sendMessage(gameInfo.chatid, "Dealer got a Blackjack, game over!");
        setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, "The game has ended, would you like to start another round or quit?", {
            reply_markup: {
                inline_keyboard:
                    [
                        [
                            { text: "Start new round", callback_data: "blackjack2" },
                            { text: "Quit", callback_data: "quit" }
                        ]
                    ]
            }
        }), 1000);
        dealer.blackjack = true;
        for (p of players.playerArr) { // settling money
            p.money -= (p.bet * 2);
            dealer.money += (p.bet * 2);
        }
        gameInfo.started = false;
    } else {
        // checking players
        for (p of players.playerArr) {
            if (p.oneAceSum == 21) {
                bot.telegram.sendMessage(gameInfo.chatid, p.first_name + " got a Blackjack!");
                p.blackjack = true; // set value to true so that the game knows to skip this guy's turn
            }
        }
    }
}

// checks whether the player has gone bust
// only occurs when player's sum exceeds 21
function checkBust(player) {
    return player.sum > 21;
}

// reveals all but one of the dealer's cards
function revealCardsDealer() {
    const dealerCards = players.dealer.cards.map(x => x.join(" of "));
    const cardsToExpose = dealerCards.slice(1);
    bot.telegram.sendMessage(gameInfo.chatid, `The dealer's cards shown are:
${cardsToExpose.join("\n")}`);
}

// calculates the value of a player's hand and updates it
function updateSum(player) {
    let sum = 0;
    for (c of player.cards) {
        sum += value(c);
    }
    player.sum = sum;
    if (player.numAces > 0) {
        player.oneAceSum = player.sum + 10;
    } else {
        player.oneAceSum = player.sum;
    }
}

// #################################################################### BLACKJACK SIMULATION FUNCTIONS ############################################################################
// ################################################################################################################################################################################

// creates a new deck and shuffles it
// Each card is represented by a size 2 array, index 0 is the number, index 1 is the suit
function makeDeck() {
    let i = 1;
    deck.cards = [];
    // Diamonds
    while (i <= 10) {
        var newCard = [i, "♦"];
        deck.cards.push(newCard);
        i++;
    }
    deck.cards.push(["Jack", "♦"]);
    deck.cards.push(["Queen", "♦"]);
    deck.cards.push(["King", "♦"]);
    // Clubs
    while (i <= 20) {
        var newCard = [i - 10, "♣"];
        deck.cards.push(newCard);
        i++;
    }
    deck.cards.push(["Jack", "♣"]);
    deck.cards.push(["Queen", "♣"]);
    deck.cards.push(["King", "♣"]);
    // Hearts
    while (i <= 30) {
        var newCard = [i - 20, "♥"];
        deck.cards.push(newCard);
        i++;
    }
    // Spades
    deck.cards.push(["Jack", "♥"]);
    deck.cards.push(["Queen", "♥"]);
    deck.cards.push(["King", "♥"]);
    while (i <= 40) {
        var newCard = [i - 30, "♠"];
        deck.cards.push(newCard);
        i++;
    }
    deck.cards.push(["Jack", "♠"]);
    deck.cards.push(["Queen", "♠"]);
    deck.cards.push(["King", "♠"]);
    // shuffle the deck when done adding
    shuffle(deck.cards);
}

function dealCards() {
    // deals one card to each player
    for (p of players.playerArr) {
        let card = drawCard();
        if (isAce(card)) {
            p.numAces++;
        }
        p.cards.push(card);
    }

    // deals one card to the dealer
    let card = drawCard();
    if (isAce(card)) {
        players.dealer.numAces++;
    }
    players.dealer.cards.push(card);

    // deals second card to each player
    for (p of players.playerArr) {
        let card = drawCard();
        if (isAce(card)) {
            p.numAces++;
        }
        p.cards.push(card);
    }

    // deals second card to dealer
    let card2 = drawCard();
    if (isAce(card2)) {
        players.dealer.numAces++;
    }
    players.dealer.cards.push(card2);

    // updates player sums
    for (p of players.playerArr) {
        updateSum(p);
    }
    updateSum(players.dealer);

    // privately sends the hands to the players involved
    for (p of players.playerArr) { // not really needed because all players' hands are revealed anyway
        sendHand(p);
    }
    sendHand(players.dealer);
}

// Sends players a prompt to let them decide what action they want to take
function playerActionBJ(player) {
    bot.telegram.sendMessage(player.id, "It's your turn! What do you want to do?", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Hit", callback_data: "hit" },
                    { text: "Double", callback_data: "double" }
                ],
                [
                    { text: "Stand", callback_data: "stand" },
                ]
            ]
        }
    })
}

// Function to progress the game and cycle through each player's turn
function turnProgBJ(n) {
    if (n < (players.numPlayers - 1)) { // minus 1 because dealer not included
        let currentPlayer = players.playerArr[gameInfo.turnCounter]
        if (!currentPlayer.bust && !currentPlayer.stand && !currentPlayer.blackjack) { // checking if they are still eligible to take a turn
            playerActionBJ(currentPlayer); // runs until the player ends their turn
        } else {
            gameInfo.turnCounter++;
            turnProgBJ(gameInfo.turnCounter);
        }
    } else {
        setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, "It's now the dealer's turn! The dealer needs to use /dealersturn to execute the dealer's turn."), 1000);
    }
}

// To be used after all the players have finished their turn
// Plays out the turn for the dealer
function executeDealer() {
    let dealer = players.dealer;
    let x = 0;
    while (!dealer.bust && !dealer.stand) { // check if dealer can still perform actions
        // HAS ACE
        if (dealer.numAces > 0) {
            if (checkBust(dealer)) {
                // CONFIRM BUST
                dealer.bust = true;
                setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, dealer.first_name + " has gone bust! Too bad!"), x);
            } else if ((dealer.oneAceSum >= 17 && dealer.oneAceSum <= 21) || dealer.sum >= 17) { // if dealer's ace sum >= 17, he must stand (from bicyclecards.com)
                // CONFIRM STAND
                dealer.stand = true;
                setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, dealer.first_name + " stands."), x);
            } else if (dealer.sum < 17 && dealer.oneAceSum > 21) {
                // sum < 17, so must hit
                let drawnCard = drawCard();
                dealer.cards(push(drawnCard));
                updateSum(dealer)
                setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, players.dealer.first_name + " hits and draws a " + drawnCard.join(" of ")), x);
                x += 1000;
                setTimeout(() => revealCardsDealer(), x);
                x += 1000;
            }
        }
        // NO ACE 
        else {
            if (checkBust(dealer)) { // BUST
                dealer.bust = true;
                setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, dealer.first_name + " has gone bust! Too bad!"), x);
            } else if (dealer.sum >= 17) { // STAND
                dealer.stand = true;
                setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, dealer.first_name + " stands."), x);
            } else { // HIT
                let drawnCard = drawCard();
                dealer.cards.push(drawnCard);
                updateSum(dealer);
                setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, dealer.first_name + " hits and draws a " + drawnCard.join(" of ")), x);
                x += 1000;
                setTimeout(() => revealCardsDealer(), x);
                x += 1000;
            }
        }
    }
    BJGamePhases.dealerFinished = true;
    setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, "The dealer's turn is over! Time to view the results. The host needs to use /comparecards to view the game results."), x+1000);
}

// To be used after all players AND dealer have finished their turns
function compareCards() {
    let winners = [];
    let draws = [];
    let losers = [];
    let bj = [];
    let dealer = players.dealer;
    let x = 0;
    if (dealer.bust) {
        // dealer busted
        bot.telegram.sendMessage(gameInfo.chatid, "The dealer went bust! All surviving players win and players who went bust draw! Congrats!");
        for (p of players.playerArr) {
            if (p.bust) { // player busted
                draws.push(p.first_name);
            } else if (p.blackjack) { // player got a blackjack at the start
                bj.push(p.first_name);
            } else {
                winners.push(p.first_name);
            }
        }
    } else {
        // revealing each player's cards
        for (p of players.playerArr) {
            revealCards(p)
        }
        x += 1000;
        // deciding which of the dealer's values to use
        let dealerSum = 0;
        if (dealer.numAces > 0) {
            dealerSum = dealer.oneAceSum > 21
                ? dealer.sum // if dealer's ace sum exceeds
                : dealer.oneAceSum // if dealer's ace sum does not exceed
        } else {
            dealerSum = dealer.sum;
        }

        // reveals dealer's cards to the chat
        setTimeout(() => revealCards(players.dealer), x);
        x += 1000;

        // handling players
        for (p of players.playerArr) {

            // deciding which of the player's values to use
            let playerSum = 0;
            if (p.numAces > 0) {
                playerSum = p.oneAceSum > 21
                    ? p.sum // if player's ace sum exceeds
                    : p.oneAceSum // if player's ace sum does not exceed
            } else {
                playerSum = p.sum
            }

            // splitting players into categories
            if (p.bust) { // player busted
                losers.push(p.first_name);
            } else if (p.blackjack) { // player got a blackjack at the start
                bj.push(p.first_name);
            } else if (playerSum > dealerSum) { // player wins dealer
                winners.push(p.first_name);
            } else if (playerSum == dealerSum) { // player draws with dealer
                draws.push(p.first_name);
            } else { // player loses to dealer
                losers.push(p.first_name);
            }
        }
    }
    // handling money
    // each player's money will already be deducted from when the cards are dealt
    for (w of winners) {
        for (p of players.playerArr) {
            if (w.id == p.id) {
                p.money += w.bet;
                dealer.money -= w.bet;
                break;
            }
        }
    }
    for (b of bj) {
        for (p of players.playerArr) {
            if (b.id == p.id) {
                p.money += (p.bet * 2);
                dealer.money -= (p.bet * 2);
            }
        }
    }
    for (l of losers) { // doesn't require a nested loop because you don't need to edit the player object itself
        dealer.money += l.bet;
    }
    setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, `Here are the results!
Winners: ${winners.length == 0 ? "Nobody" : winners.join(", ")}
Draws: ${draws.length == 0 ? "Nobody" : draws.join(", ")}
Losers: ${losers.length == 0 ? "Nobody" : losers.join(", ")}
Blackjacks: ${bj.length == 0 ? "Nobody" : bj.join(", ")}

This is the end of the game! Would you like to start another round or quit?`, {
        reply_markup: {
            inline_keyboard:
                [
                    [
                        { text: "Start new round", callback_data: "blackjack2" },
                        { text: "Quit", callback_data: "quit" }
                    ]
                ]
        }
    }), x);
    gameInfo.started = false; // marks the game as ended
}

// ######################################################################## POKER ############################################################################################
// ###########################################################################################################################################################################

/*
    Game Flow:
    1. Create lobby
    2. Make deck
    3. Deal first two cards to players
    4. First betting phase
    5. Open next 3 cards
    6. Second betting phase
    7. Open 1 card
    8. Third betting phase
    9. Open last card
    10. Final betting phase
    11. Reveal all cards, compare hands
    12. Settle winnings

    Order:
    1. Royal Flush: Same suit, 10 J Q K A
    2. Straight Flush: Same suit, 5 numbers in a row
    3. Four of a kind
    4. Full House: 3 same cards, 2 other same cards
    5. Flush
    6. Straight
    7. Three of a kind
    8. Two pair
    9. Pair
    10. High Card
*/


// ################################################################# POKER OBJECTS ######################################################################################
// ######################################################################################################################################################################

var pot = 0; // money in the pot
var table = []; // cards that are on the table
var currentHighestBet = 0

var lastRaised = "null";
var numFolded = 0;
var raising = false;
// keep track of what phase the game is in
var pokerGamePhases = {
    cardsDealt: false,
    currentCardPhase: 0, // start = 0, flop = 1, turn = 2, river = 3
}
var cycle = false; // checks whether the game has cycled back to the player who last raised the bet

// ################################################################# POKER BOT COMMANDS #################################################################################
// ######################################################################################################################################################################

bot.action("fold", ctx => { // Kick the player out of the game
    ctx.deleteMessage();
    ctx.reply("You've folded, better luck next time!");
    let currentPlayer = players.playerArr[gameInfo.turnCounter];
    bot.telegram.sendMessage(gameInfo.chatid, `${currentPlayer.first_name} folds.`)
    currentPlayer.fold = true;
    currentPlayer.bestHand = "Folded";
    currentPlayer.ranking = 100;
    numFolded++;
    gameInfo.turnCounter++;
    turnProgPoker(gameInfo.turnCounter);
})

bot.action("check", ctx => { // Basically just do nothing, unless the player was the last raised
    ctx.deleteMessage();
    ctx.reply("You have successfully checked.");
    let curr = players.playerArr[gameInfo.turnCounter];
    if (cycle) { // current player is the one who last raised the bet --> completed one round of the table (NEVER REACH HERE)
        // start next phase
        bot.telegram.sendMessage(gameInfo.chatid, `${curr.first_name} checks.`);
        cycle = false;
        gameInfo.turnCounter++;
        setTimeout(() => openCardsPoker(pokerGamePhases.currentCardPhase), 1000); // draws cards depending on what phase the game is in 
        setTimeout(() => pokerGamePhases.currentCardPhase++, 1500); // progress counter to next phase
        setTimeout(() => betPhase(pokerGamePhases.currentCardPhase), 3000); // begins next betting phase 
    } else {
        bot.telegram.sendMessage(gameInfo.chatid, `${curr.first_name} checks.`);
        gameInfo.turnCounter++;
        turnProgPoker(gameInfo.turnCounter);
    }
})

bot.action("call", ctx => { // Raise the player's bet to match
    ctx.deleteMessage();
    let curr = players.playerArr[gameInfo.turnCounter];
    let diff = 0;
    if (currentHighestBet - curr.bet > curr.money) { // Player doesn't have enough money to match the bet
        diff = curr.money - curr.bet;
        curr.bet = curr.money;
        ctx.reply("You don't have enough money to match the bet, so you've gone all-in.");
        bot.telegram.sendMessage(gameInfo.chatid, `${curr.first_name} has gone all-in, raising their bet to ${curr.money}!`);
    } else { // Player matches the bet
        diff = currentHighestBet - curr.bet;
        curr.bet = currentHighestBet;
        ctx.reply(`You have raised your bet to ${currentHighestBet}.`);
        bot.telegram.sendMessage(gameInfo.chatid, `${curr.first_name} calls the bet, raising their bet to ${currentHighestBet}!`);
    }
    pot += diff;
    curr.money -= diff;
    lastRaised = curr.id;
    curr.broke = curr.money == 0;
    gameInfo.turnCounter++;
    turnProgPoker(gameInfo.turnCounter);
})

bot.action("raise", ctx => {
    ctx.deleteMessage();
    raising = true;
    ctx.reply("How much do you want to raise the bet to? Use the command /raise <amount> to indicate a new value, or enter a negative value to cancel.");
})

bot.command("raise", ctx => {
    verifyGame("Poker");
    if (!raising) {
        ctx.reply("You can't do that now.");
    } else {
        let curr = players.playerArr[gameInfo.turnCounter];
        if (ctx.from.id != curr.id) { // verifying that the correct player is doing the raising
            ctx.reply("It's not your turn to do this!");
            return;
        }
        const text = ctx.update.message.text;
        const amt = parseInt(text.split(' ')[1]);
        if (isNaN(amt)) {
            ctx.reply("Please enter a valid number!");
        } else if (amt < 0) { // Restarts the player's turn if they change their mind
            raising = false;
            turnProgPoker(gameInfo.turnCounter);
        } else if (amt > curr.money) { // Player doesn't have enough money
            ctx.reply("You don't have enough money to bet that!");
        } else if (amt < currentHighestBet) { // Player enters a lower value
            ctx.reply(`Please enter a value higher than the current highest bet (${currentHighestBet}).`);
        } else {
            ctx.reply(`You have successfully raised your bet to ${amt}.`);
            bot.telegram.sendMessage(gameInfo.chatid, `${ctx.from.first_name} has raised their bet to ${amt} credits!`)
            // updating player
            const diff = amt - curr.bet;
            pot += diff;
            curr.bet = amt;
            curr.money -= diff;
            curr.broke = curr.money == 0;
            raising = false;
            // updating the highest bet
            currentHighestBet = amt;
            lastRaised = curr.id;
            gameInfo.turnCounter++;
            turnProgPoker(gameInfo.turnCounter);
        }
    }
})

bot.action("poker2", ctx => {
    ctx.deleteMessage();
    ctx.reply(`A new round of poker has been started with ${ctx.from.first_name} as the host.`);
    softReset();
    makeDeck();
    gameInfo.host = ctx.from.id;
})

bot.command("comparecardspoker", (ctx) => {
    if (!gameInfo.hosted) {
        ctx.reply("There isn't a game going on right now.");
    } else if (!gameInfo.started) {
        ctx.reply("The game hasn't started yet!");
    } else {
        verifyGame("Poker");
        if (verifyHost(ctx.from)) {
            if (pokerGamePhases.currentCardPhase < 4) {
                ctx.reply("The betting phases haven't ended yet!");
            } else {
                checkHandsPoker();
                setTimeout(() => compareAllPlayers(), 1000);
            }
        } else {
            ctx.reply("Only the host can use this command, sorry!");
        }
    }
})

// ################################################################# POKER MISC FUNCTIONS ###############################################################################
// ######################################################################################################################################################################

function turnProgPoker(n) {
    let backToStart = false;
    if (n == players.numPlayers) { // looping the turn counter
        gameInfo.turnCounter = 0;
        backToStart = true;
    }
    // checking if everyone has folded except one guy
    if (numFolded == players.numPlayers - 1) { 
        for (p of players.playerArr) {
            if (!p.fold) { // declare this guy the winner
                bot.telegram.sendMessage(gameInfo.chatid, `${p.first_name} is the last player standing, taking all the money in the pot!`);
                p.money += pot;
                pot = 0;
                setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, "The game has ended! Would you like to start a new round or quit?", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {text: "Start new round", callback_data: "poker2"},
                                {text: "Quit", callback_data: "quit"}
                            ]
                        ]
                    }
                }), 1000);
                return;
            }
        }
    }
    // normal turn progression cycling
    let curr = players.playerArr[gameInfo.turnCounter];
    if (!curr.fold && !curr.broke) { // player is still eligible for an action
        if (curr.bet != currentHighestBet) { // player's bet is less than the highest bet, so he has the option to call
            playerActionPokerCall(curr);
        } else { // player's bet is already the highest, so he has the option to check
            if (curr.id == lastRaised || (lastRaised == "null" && backToStart)) { // CAN STUCK IN LOOP SOMETIMES
                // checks whether the game cycled back to the last player who raised, OR nobody has raised yet and its gone one round
                cycle = true; 
            }
            playerActionPokerCheck(curr);
        }
    } else { // player has folded or is broke, so skip them
        gameInfo.turnCounter++;
        turnProgPoker(gameInfo.turnCounter); // go on to the next guy since current guy is not eligible to do anything
    }
}

// Comparator to sort cards
function cardSorter(firstcard, secondcard) {
    return trueValue(firstcard) - trueValue(secondcard);
}

// Combines both the table cards and the player's cards into one pile for checking
// Returns a copy, does not modify original arrays
function compileCards(player) {
    let total = [];
    total.push(player.cards[0]);
    total.push(player.cards[1]);
    for (card of table) {
        total.push(card);
    }
    return total;
}

// Only one possible combination
function checkRoyalFlush(cards) {
    let ace = false;
    let k = false;
    let q = false;
    let j = false;
    let ten = false;
    let store = [];
    for (c of cards) {
        if (trueValue(c) == 14) { ace = true; store.push(c); }
        if (trueValue(c) == 13) { k = true; store.push(c); }
        if (trueValue(c) == 12) { q = true; store.push(c); }
        if (trueValue(c) == 11) { j = true; store.push(c); }
        if (trueValue(c) == 10) { ten = true; store.push(c); }
    }
    return ace && k && q && j && ten && checkFlush(store)[0];
}

// Checks for Straight Flush
// returns [boolean, highcard, suit]
function checkStraightFlush(cards) {
    let flush = checkFlush(cards);
    if (!flush[0]) { // if got no flush, obviously wont have a straight flush
        return [false, 0, 0];
    } else {
        const filt = cards.filter(x => suit(x) == flush[2]); // filters out the cards that arent part of the flush
        let str = checkStraight(filt);
        return [str[0], str[1], flush[2]] 
    }
}

// Check for 4 of a kind
// Only need to check once cos only 7 cards
// returns [boolean, highcard]
function check4Kind(cards) {
    let copy = cards.map(x => trueValue(x));
    copy.sort(properSort);
    let streak = 0;
    let highest = 0;
    let boo = false;
    for (let i = 0; i < copy.length - 1; i++) {
        if (copy[i] == copy[i + 1]) {
            streak++;
        }
        if (streak == 4) {
            highest = copy[i];
            boo = true;
            break;
        }
    }
    return [boo, highest];
}


// check for 3, then throw away the 3, then check for 2
// returns [boolean, 3highest, 2highest]
// 2x 3 of a kind also counted as full house
// only can have 3 2 2 (check which of the 2 is higher) or 3 3 1 (check which of the 3 is higher, throw the 1)
function checkFullHse(cards) {
    let copy = cards.map(x => x);
    const result = check3Kind(copy, 0, 0); // [num, highcard]
    let high3 = 0;
    let high2 = 0;
    if (result[0] == 0) { // no 3 of a kind at all -> not possible to have full house
        return [false, 0, 0];
    } else if (result[0] == 1) { // possible 3 2 2
        let filt = cards.filter(x => trueValue(x) != result[1]); // filter out the original 3 of a kind
        const result2 = checkPair(filt, 0, 0);
        if (result2[0] == 0) { // no pair is found -> not possible to have full house
            return [false, 0, 0];
        } else { // a pair is found
            high3 = result[1]; // mark high card of the triple
            high2 = result2[1]; // mark high card of the pair
            return [true, high3, high2];
        }
    } else if (result[0] == 2) { // definite 3 3 1
        let filt = cards.filter(x => trueValue(x) != result[1]); // filter out the original 3 of a kind
        const result2 = check3Kind(filt, 0, 0);
        high3 = result[1];
        high2 = result2[1];
        return [true, high3, high2];
    }
}

// Checks whether a set of cards have a flush
// returns [boolean, highcard, suit]
function checkFlush(cards) {
    let spade = 0;
    let diamond = 0;
    let heart = 0;
    let club = 0;
    let flush = false;
    let flushSuit = "";
    let highCard = 0;
    for (c of cards) {
        switch (suit(c)) {
            case "Spades":
                spade++;
                break;
            case "Diamonds":
                diamond++;
                break;
            case "Hearts":
                heart++;
                break;
            case "Clubs":
                club++;
        }
    }
    if (spade >= 5) { flushSuit = "Spades"; flush = true; }
    else if (diamond >= 5) { flushSuit = "Diamonds"; flush = true; }
    else if (heart >= 5) { flushSuit = "Hearts"; flush = true; }
    else if (club >= 5) { flushSuit = "Clubs"; flush = true; }
    if (flush) {
        let filt = cards.filter(x => suit(x) == flushSuit);
        highCard = filt.map(x => value(x)).reduce(function(a , b) {
            return Math.max(a, b);
        });
        return [true, highCard, flushSuit];
    } else {
        return [false, 0, "N/A"];
    }
}

// check whether got straight hand 
// TODO: REVERSE THE ITERATING ORDER
// TODO: CHECK WHY IT DOESNT WORK
// Returns [boolean, highCard]
function checkStraight(cards) {
    let copy = cards.map(x => trueValue(x));
    copy.sort(properSort);
    let streak = 1;
    let marker = copy.length - 1; // marker to indicate highcard
    let check = false;
    let highCard = 0;
    for (let i = copy.length - 1; i > 0; i--) {
        if (copy[i] - 1 == copy[i - 1]) {
            streak++;
        } else if (copy[i] == copy[i - 1]) {
            continue;
        } else {
            marker = i - 1;
            streak = 1;
        }
        if (streak >= 5) {
            check = true;
            highCard = copy[marker];
            break;
        }
    }
    // Checking for overflow
    const min = copy.reduce(function(a,b) {return Math.min(a,b);});
    const max = copy.reduce(function(a,b) {return Math.max(a,b);});
    if (min == 2 && max == 14) {
        for (let i = copy.length - 1; i > 0; i--) {
            if (copy[i] - 1 == copy[i - 1]) {
                streak++;
            } else if (copy[i] == copy[i - 1]) {
                continue;
            } else {
                streak = 1;
            }
            if (streak >= 5) {
                check = true;
                highCard = 14;
                break;
            }
        }
    }
    return [check, highCard];
}

// Used to find number of 3 of a kind hands possible
// can have up to 2 3 of a kinds
// To be initially called with num = 0, highest = 0;
// returns [number, highcard]
function check3Kind(cards, num, highest) {
    let copy = cards.map(x => typeof x == "number" ? x : trueValue(x));
    copy.sort(properSort);
    let streak = 1;
    let filt = [];
    let checkAgain = false;
    let store = highest;
    for (let i = 0; i < copy.length - 1; i++) {
        if (copy[i] == copy[i + 1]) { // two consecutive numbers are found
            streak++;
        }
        if (streak > 3) { // a triple has been found
            const mark = copy[i];
            filt = copy.filter(x => x != mark); // filter out the triple that has been found
            checkAgain = true;
            if (copy[i] > store) {
                store = copy[i]; // track the highest card found
            }
            break;
        }
    }
    if (checkAgain) {
        return check3Kind(filt, num + 1, store);
    } else {
        return [num, store];
    }
}

// check for 2 pair
// Assume to not have 3 of a kind anymore
// num refers to the number of pairs found, highest refers to the highest card
// To be initially called with highest = 0;
// returns [number, highcard]
function checkPair(cards, num, highest) {
    let copy = cards.map(x => typeof x == "number" ? x : trueValue(x));
    copy.sort(properSort);
    let streak = false;
    let filt = [];
    let checkAgain = false; // boolean to track whether there's even a pair present in the first place
    let store = highest;
    for (let i = 0; i < copy.length - 1; i++) {
        if (copy[i] == copy[i + 1]) { // two consecutive numbers are found
            streak = true;
        }
        if (streak) { // a pair has been found
            const mark = copy[i];
            filt = copy.filter(x => x != mark); // filter out the pair that has been found
            checkAgain = true;
            if (copy[i] > store) {
                store = copy[i]; // track the highest card found
            }
            break;
        }
        
    }
    if (checkAgain) { // if a pair has been found, recurse to check whether there's more than 1 pair
        return checkPair(filt, num + 1, store); // recursion runs until no more pairs can be found
    } else {
        return [num, highest]; // returns the answer as an array with the number of pairs found and the highest card
    }
}

// Checking for fold or broke is already done before hand
function playerActionPokerCheck(player) {
    bot.telegram.sendMessage(player.id, "It's your turn! Choose an action to take.", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Fold", callback_data: "fold" },
                    { text: "Raise", callback_data: "raise" },
                    { text: "Check", callback_data: "check" }
                ]
            ]
        }
    })
}

// Checking for fold or broke is already done before hand
function playerActionPokerCall(player) {
    bot.telegram.sendMessage(player.id, "It's your turn! Choose an action to take.", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Fold", callback_data: "fold" },
                    { text: "Raise", callback_data: "raise" },
                    { text: "Call", callback_data: "call" }
                ]
            ]
        }
    })
}

function dealCardsPoker() {
    for (p of players.playerArr) {
        p.cards.push(drawCard());
        p.cards.push(drawCard());
        sendHand(p);
    }
    bot.telegram.sendMessage(gameInfo.chatid, "The cards have been dealt to each player.");
    setTimeout(() => betPhase(0), 1500);
}

// Handles the checking of each player's cards and assigning them their rank
function checkHandsPoker() {
    for (p of players.playerArr) {
        console.log("LOG: " + p.first_name);
        let total = compileCards(p);
        if (p.fold) { // Fold
            p.ranking = 10000;
            p.bestHand = "Folded";
            p.handHighestCard = -1;
        } else {
            if (checkRoyalFlush(total)) { // checking royal flush
                p.ranking = 1;
                p.bestHand = "Royal Flush";
            } else {
                let csf = checkStraightFlush(total);
                if (csf[0]) { // checking straight flush
                    p.ranking = 2;
                    p.bestHand = "Straight Flush";
                    p.handHighestCard = csf[1];
                } else {
                    let c4 = check4Kind(total);
                    if (c4[0]) { // checking four of a kind
                        p.ranking = 3;
                        p.bestHand = "4 of a Kind";
                        p.handHighestCard = c4[1];
                    } else {
                        let cfh = checkFullHse(total);
                        if (cfh[0]) { // full house
                            p.ranking = 4;
                            p.bestHand = "Full House";
                            p.handHighestCard = cfh[1];
                        } else {
                            let cf = checkFlush(total);
                            if (cf[0]) { // flush
                                p.ranking = 5;
                                p.bestHand = "Flush";
                                p.handHighestCard = cf[1];
                            } else {
                                let cs = checkStraight(total);
                                if (cs[0]) { // straight
                                    p.ranking = 6;
                                    p.bestHand = "Straight";
                                    p.handHighestCard = cs[1];
                                } else {
                                    let c3 = check3Kind(total, 0, 0);
                                    if (c3[0]) { // 3 of a kind
                                        p.ranking = 7;
                                        p.bestHand = "3 of a Kind";
                                        p.handHighestCard = c3[1];
                                    } else { // Pairs
                                        let cp = checkPair(total, 0, 0);
                                        console.log(cp);
                                        console.log(total);
                                        if (cp[0] > 1) { // 2 pair
                                            p.ranking = 8;
                                            p.bestHand = "2 Pair";
                                            p.handHighestCard = cp[1];
                                        } else if (cp[0] == 1) { // pair
                                            p.ranking = 9;
                                            p.bestHand = "Pair";
                                            p.handHighestCard = cp[1];
                                        } else { // high card
                                            p.ranking = 10;
                                            p.bestHand = "High Card";
                                            p.handHighestCard = total.map(x => trueValue(x)).reduce(function(a, b) {
                                                return Math.max(a, b);
                                            });
                                        } 
                                    } 
                                } 
                            } 
                        } 
                    } 
                } 
            } 
        }   
    }
}

// Sorts players according to their ranking, smallest first
function playerSorter(p1, p2) {
    return p1.ranking - p2.ranking;
}

// Sorts players according to their high card, largest first
function playerSorterHighCard(p1, p2) {
    return p2.handHighestCard - p1.handHighestCard;
}


// ################################################################# POKER SIMULATOR FUNCTIONS ##########################################################################
// ######################################################################################################################################################################

// handles the initial bets put in by every player
function initialBets() {
    // Setting the bets
    for (p of players.playerArr) {
        p.bet = 10;
        p.money -= 10;
        pot += 10;
    }
    currentHighestBet = 10;
    bot.telegram.sendMessage(gameInfo.chatid, `Initial bets (ante) of 10 credits have been put in for every player.`);
}

// handles whether the game should end, or continue to the next betting phase
function betPhase(phase) {
    // 3 means comparing of cards
    if (phase > 3) {
        let curr = players.playerArr[gameInfo.turnCounter];
        bot.telegram.sendMessage(gameInfo.chatid, "This is the end of the round! All players will now reveal their cards.");
        // let x = 0;
        setTimeout(() => { for (p of players.playerArr) { // revealing each player's cards
            if (p.fold) {
                bot.telegram.sendMessage(gameInfo.chatid, `${p.first_name} has folded, so their hand isn't be revealed.`);
            } else {
                revealCards(p);
            }
            // x += 1000;
        }}, 1000)
        bot.telegram.sendMessage(gameInfo.chatid, "Game Host, please use /comparecardspoker to view the game results!");
        // setTimeout(() => checkHandsPoker(), x);
        // setTimeout(() => compareAllPlayers(), x + 2000);
    } else {
        if (phase == 0) { // start of the game
            bot.telegram.sendMessage(gameInfo.chatid, "The first betting phase has started!");
        } else {
            bot.telegram.sendMessage(gameInfo.chatid, "The next phase of betting has started!");
        }
        turnProgPoker(gameInfo.turnCounter);
    }
}

// Draws the number of cards and puts them on the table
function openCardsPoker(number) {
    if (number == 0) { // 0 means no cards on the table, so draw 3
        table.push(drawCard());
        table.push(drawCard());
        table.push(drawCard());
        bot.telegram.sendMessage(gameInfo.chatid, `The cards on the table are:
${table.map(x => x.join(" of ")).join("\n")}`);
    } else if (number < 3) { // 1, 2 and 3 --> 1 and 2 draw 1 card each, 3 signifies no more cards to be drawn
        // 1 and 2 draws 1 card
        table.push(drawCard());
        bot.telegram.sendMessage(gameInfo.chatid, `The cards on the table are:
${table.map(x => x.join(" of ")).join("\n")}`);
    } 
}

// Compares the hands of all players at the end of the round, and decides who is the winner
function compareAllPlayers() {
    let copiedPlayersArr = players.playerArr.map(x => x);
    copiedPlayersArr.sort(playerSorter);
    let tiedPlayers = copiedPlayersArr.filter(x => x.ranking == copiedPlayersArr[0].ranking); // obtaining all players with the same winning hand

    if (tiedPlayers.length == 1) { 
        // Only one winner, nobody with tied winning hand
        let winner = tiedPlayers[0];
        bot.telegram.sendMessage(gameInfo.chatid, `${winner.first_name} is the winner with a ${winner.bestHand} and high card ${demap(winner.handHighestCard)}.`);
        winner.money += pot;
        pot = 0;
    } else { 
        // Got players with tied hands
        tiedPlayers.sort(playerSorterHighCard)
        let tiedPlayersFilt = tiedPlayers.filter(x => x.handHighestCard == tiedPlayers[0].handHighestCard); // obtaining all players with tied hands that share the same highcard

        if (tiedPlayersFilt.length == 1) { 
            // One player with highest card
            let winner = tiedPlayersFilt[0];
            bot.telegram.sendMessage(gameInfo.chatid, `${winner.first_name} is the winner with a ${winner.bestHand} and high card ${demap(winner.handHighestCard)}.`);
            winner.money += pot;
            pot = 0;
        } else { 
            // More than one player with tied highest card
            bot.telegram.sendMessage(gameInfo.chatid, `${tiedPlayersFilt.map(x => x.first_name).join(", ")} are tied with winning hands of ${tiedPlayersFilt[0].bestHand}, high card ${demap(tiedPlayersFilt[0].handHighestCard)}. 
The earnings are split between them.`);
            const denom = tiedPlayersFilt.length;
            for (p of tiedPlayersFilt) {
                p.money += Math.round((pot/denom) * 100) / 100; // converts to 2dp
            }
            pot = 0;
        }
    }
    setTimeout(() => bot.telegram.sendMessage(gameInfo.chatid, "This is the end of the game. Would you like to start another round, or quit?", {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: "Start new round", callback_data: "poker2"},
                    {text: "Quit", callback_data: "quit"}
                ]
            ]
        }
    }), 3000);
}

// ################################################################# EXTRA STUFF ########################################################################################
// ######################################################################################################################################################################

// Used for changing players (placed at the bottom due to issues conflicting with bot.command functions)
bot.on("text", (ctx) => {
    if (changingPlayers && verifyHost(ctx.from)) {
        const newMax = parseInt(ctx.update.message.text);
        if (isNaN(newMax) || newMax < 2) {
            ctx.reply("Please enter a valid number!");
        } else if (newMax < players.playerArr.length) {
            ctx.reply("There are already more than that number of players in the game! Please enter a smaller number.");
        } else {
            gameInfo.maxPlayers = newMax;
            ctx.reply("The new number of max players is now " + newMax + ".");
            changingPlayers = false;
        }
    } else if (changingMoney && verifyHost(ctx.from)) {
        const newAmt = parseInt(ctx.update.message.text);
        if (isNaN(newAmt) || newAmt < 0) {
            ctx.reply("Please enter a valid number!");
        } else {
            gameInfo.defaultMoney = newAmt;
            ctx.reply("The default money has been changed to " + newAmt + ".");
            changingMoney = false;
        }
    } else if ((changingMoney || changingPlayers) && !verifyHost(ctx.from)) {
        ctx.reply("You need to be the host for this.");
    }
})

