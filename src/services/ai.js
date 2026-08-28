import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function generateWorkoutAnalysis(
    currentWorkout,
    pastWorkouts,
    retries = 3,
) {
    try {
        let historicalContext = '';

        currentWorkout.exercises.forEach(currentEx => {
            const pastWorkout = pastWorkouts.find(w =>
                w.exercises.some(e => e.exercise.id === currentEx.exercise.id),
            );

            // Calculate max weight and average reps to give the AI better insights than just "total volume"
            const currentMaxWeight = Math.max(
                ...currentEx.sets.map(s => Number(s.weight)),
            );
            const currentTotalReps = currentEx.sets.reduce(
                (sum, s) => sum + Number(s.reps),
                0,
            );
            const currentAvgReps = Math.round(
                currentTotalReps / currentEx.sets.length,
            );

            if (pastWorkout) {
                const pastEx = pastWorkout.exercises.find(
                    e => e.exercise.id === currentEx.exercise.id,
                );
                const pastMaxWeight = Math.max(
                    ...pastEx.sets.map(s => Number(s.weight)),
                );
                const pastVolume = pastEx.sets.reduce(
                    (total, set) =>
                        total + Number(set.weight) * Number(set.reps),
                    0,
                );
                const currentVolume = currentEx.sets.reduce(
                    (total, set) =>
                        total + Number(set.weight) * Number(set.reps),
                    0,
                );

                historicalContext += `
        - ${currentEx.exercise.name}: 
          Today: ${currentEx.sets.length} sets, Top Weight: ${currentMaxWeight}kg, Avg Reps/Set: ${currentAvgReps}, Total Vol: ${currentVolume}kg. 
          Last Time: Top Weight: ${pastMaxWeight}kg, Total Vol: ${pastVolume}kg.`;
            } else {
                historicalContext += `\n- ${currentEx.exercise.name}: First time logging this. Top Weight: ${currentMaxWeight}kg for ~${currentAvgReps} reps/set.`;
            }
        });

        // The upgraded, highly specific prompt
        const prompt = `
      You are an elite, data-driven strength and conditioning coach analyzing a client's latest session.
      
      Workout Name: ${currentWorkout.name}
      Duration: ${currentWorkout.duration} minutes
      
      Data Breakdown:
      ${historicalContext}
      
      Task: Write a punchy, highly insightful 3-sentence post-workout analysis. 
      
      Rules:
      1. DO NOT just repeat the numbers back to the user. Interpret what the numbers mean.
      2. If average reps are high (10-15+), note that they are building great hypertrophy and endurance.
      3. If they lifted heavier than last time but volume dropped, praise the strength adaptation.
      4. Give ONE specific piece of actionable advice for their NEXT session based on this data (e.g., "Since you hit 12 reps on bench easily, bump the weight by 2.5kg next week").
      5. Keep the tone modern, gritty, and professional. No emojis, no hashtags, no fluff.
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        const isBusy =
            error.status === 503 ||
            (error.message && error.message.includes('503')) ||
            error.status === 'UNAVAILABLE';

        if (isBusy && retries > 0) {
            console.warn(
                `API is busy. Retrying in 1.5 seconds... (${retries} attempts left)`,
            );
            await delay(1500);
            return generateWorkoutAnalysis(
                currentWorkout,
                pastWorkouts,
                retries - 1,
            );
        }

        console.error('AI Analysis ultimately failed:', error);

        const fallbacks = [
            'Incredible session today! You put in the work, now go get some protein and rest up.',
            'Solid effort on the volume today. The data is logged, keep this consistency up!',
            'Great workout! The servers are currently catching their breath from how hard you lifted, but your stats are saved safely.',
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}
