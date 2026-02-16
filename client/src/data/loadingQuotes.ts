export const loadingQuotes = [
    "Patience is the key to the heart(Personal Experience).",
    "Good things come to those who wait.",
    "Searching for your other half...",
    "Love is worth waiting for.",
    "The best things in life are worth the wait.",
    "Connecting paths, one soul at a time.",
    "Your story is being written...",
    "Destiny is never late.",
    "Trust the timing of your life.",
    "Sometimes what you're looking for usually comes when you're not looking.",
    "Two halves make a whole.",
    "Magic happens when you least expect it.",
    "Preparing your next chapter...",
    "The universe is aligning for you.",
    "Great love stories take time to write."
];

export const getRandomQuote = () => {
    return loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)];
};
