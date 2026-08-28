import { pipeline, env } from '@xenova/transformers';

// Tell Transformers.js to fetch from Hugging Face hub, not the local file system
env.allowLocalModels = false;

// Synonym map to help the AI understand human slang and common variations
const SYNONYM_MAP = {
    boobs: 'chest',
    breast: 'chest',
    tits: 'chest',
    pecs: 'chest',
    thigh: 'legs',
    thighs: 'legs',
    glutes: 'legs',
    butt: 'legs',
    booty: 'legs',
    bicep: 'arms',
    biceps: 'arms',
    tricep: 'arms',
    triceps: 'arms',
    abs: 'core',
    stomach: 'core',
    belly: 'core',
    calves: 'legs',
    calf: 'legs',
    shoulders: 'shoulders',
    delts: 'shoulders',
};

// Singletons to hold the model and embeddings in memory
let extractorPipeline = null;
let exerciseEmbeddingsCache = null;

// Helper to calculate how similar two concepts are (0 to 1)
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper to normalize query before sending it to the ML model
function preprocessQuery(query) {
    let words = query.toLowerCase().split(/\s+/); // Split by whitespace
    return words.map(word => SYNONYM_MAP[word] || word).join(' ');
}

// 1. Initialize the Model
export async function initModel() {
    if (!extractorPipeline) {
        // We use a tiny, lightning-fast model optimized for browsers (~22MB)
        extractorPipeline = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2',
        );
    }
    return extractorPipeline;
}

// 2. Perform the Smart Search
export async function performSmartSearch(query, exercises) {
    const model = await initModel();

    // Map slang/synonyms first so the model understands the intent
    const processedQuery = preprocessQuery(query);

    // Convert the user's sentence into a mathematical vector
    const queryOutput = await model(processedQuery, {
        pooling: 'mean',
        normalize: true,
    });
    const queryVector = Array.from(queryOutput.data);

    // If we haven't processed the exercises yet, do it once and cache it
    if (!exerciseEmbeddingsCache) {
        exerciseEmbeddingsCache = await Promise.all(
            exercises.map(async ex => {
                // Create a rich text block for the AI to understand what this exercise does
                const textToEmbed = `Exercise: ${ex.name}. MuscleGroup: ${ex.muscleGroup}. Description: ${ex.description}`;
                const out = await model(textToEmbed, {
                    pooling: 'mean',
                    normalize: true,
                });
                return { id: ex.id, vector: Array.from(out.data) };
            }),
        );
    }

    // Compare the query to every exercise
    const results = exercises.map(ex => {
        const emb = exerciseEmbeddingsCache.find(e => e.id === ex.id);
        const score = cosineSimilarity(queryVector, emb.vector);
        return { ...ex, score };
    });

    // Filter out irrelevant stuff, sort by best match, and return top 5
    return results
        .filter(r => r.score > 0.25) // Threshold tuned to allow short queries like "chest"
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Return top 5 most relevant
}
