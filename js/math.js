/**
 * Math class. Introduced to put all math-heavy stuff in single place.
 */
dojo.declare("com.nuclearunicorn.game.Math", null, {
    constructor: function() {
    },

    uniformRandomInteger: function(min, max) {
        min = Math.round(min);
        max = Math.round(max);
        return min + Math.floor(Math.random() * (max - min));
    },

    standardGaussianRandom: function() {
        // Box-Muller transform method
        var u = 0, v = 0;
        while(u === 0) {u = Math.random();} //Converting [0,1) to (0,1)
        while(v === 0) {v = Math.random();}

        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    },

    // Irwin-Hall distribution is the sum of a number of independent random uniformly distributed variables in [0,1]
    irwinHallRandom: function(trials) {
        return this.loopOrGaussianApproximation(trials, false, 1 / 2, 1 / 12, 0, 1, Math.random);
    },

    binominalRandomInteger: function(trials, successProbability) {
        return successProbability <= 0
            ? 0
            : successProbability >= 1
                ? trials
                : this.loopOrGaussianApproximation(trials, true, successProbability, successProbability * (1 - successProbability), 0, 1, function() {
                    return Math.random() < successProbability ? 1 : 0;
                });
    },

    // Parameters mean, variance, lowerBound and upperBound are the characteristics of the base distribution, not of the global sum
    loopOrGaussianApproximation: function(trials, isDiscrete, mean, variance, lowerBound, upperBound, baseDistribution) {
        var globalMean = trials * mean;
        var globalStandardDeviation = Math.sqrt(trials * variance);
        var globalLowerBound = trials * lowerBound;
        var globalUpperBound = trials * upperBound;

        // If the Gaussian approximation cannot be good enough, just use good ol' loop
        if (trials < 100
         || globalMean - 5 * globalStandardDeviation < globalLowerBound
         || globalMean + 5 * globalStandardDeviation > globalUpperBound) {
            var result = 0;
            for (var i = trials; i > 0; --i) {
                result += baseDistribution();
            }
            return result;
        }

        // If the Gaussian approximation gives a result outside the bounds, just retry
        /* eslint-disable no-constant-condition */
        while (true) {
            var result = globalStandardDeviation * this.standardGaussianRandom() + globalMean;
            if (isDiscrete) {
                result = Math.round(result);
            }
            if (globalLowerBound <= result && result <= globalUpperBound) {
                return result;
            }
        }
    },

    log1p: function(p) {
        if (Math.abs(p) > 0.25) {
            return Math.log(1 + p);
        }

        var power = p;
        var minusP = -p;
        var coefficients = [0, power];
        var n = 1 + Math.ceil(-52 * Math.LN2 / Math.log(Math.abs(p)));
        for (var i = 2; i <= n; ++i) {
            power *= minusP;
            coefficients[i] = power / i;
        }

        var result = coefficients[n];
        for (var i = n - 1; i >= 1; --i) {
        	result += coefficients[i];
        }
        return result;
    }
});
