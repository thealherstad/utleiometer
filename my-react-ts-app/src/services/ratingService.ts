export type ReviewRecord = {
    placementScore?: number
    priceScore?: number
    costScore?: number
    overallScore?: number
}

export function calculateAverageReviewScore(review: ReviewRecord) {
    const scores = [
        review.placementScore,
        review.priceScore,
        review.costScore,
        review.overallScore,
    ].filter((score): score is number => typeof score === "number" && score > 0)

    if (scores.length === 0) return 0

    const total = scores.reduce((sum, score) => sum + score, 0)
    return total / scores.length
}

export function calculateListingRating(reviews: ReviewRecord[]) {
    if (reviews.length === 0) return 0

    const total = reviews.reduce(
        (sum, review) => sum + calculateAverageReviewScore(review),
        0
    )

    return Number((total / reviews.length).toFixed(1))
}