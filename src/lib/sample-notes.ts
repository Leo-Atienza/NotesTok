export const SAMPLE_NOTES = [
  {
    label: "Biology — Cell Division",
    text: `Cell Division: Mitosis and Meiosis

Mitosis is the process by which a single cell divides to produce two genetically identical daughter cells. It is essential for growth, repair, and asexual reproduction in organisms. Mitosis occurs in somatic (body) cells and consists of four main phases: prophase, metaphase, anaphase, and telophase, followed by cytokinesis.

During prophase, chromatin condenses into visible chromosomes, each consisting of two sister chromatids joined at the centromere. The nuclear envelope begins to break down and spindle fibers form from the centrioles. In metaphase, chromosomes align along the metaphase plate (the cell's equator). Spindle fibers attach to the centromeres of each chromosome.

Anaphase begins when the sister chromatids are pulled apart by the spindle fibers toward opposite poles of the cell. Finally, during telophase, the chromatids (now individual chromosomes) arrive at the poles, nuclear envelopes reform, and the chromosomes begin to decondense. Cytokinesis then divides the cytoplasm, resulting in two identical daughter cells.

Meiosis, in contrast, is a specialized form of cell division that produces four genetically unique haploid cells (gametes). It involves two rounds of division: meiosis I and meiosis II. A critical event in meiosis I is crossing over, where homologous chromosomes exchange genetic material during prophase I, increasing genetic diversity. Independent assortment of chromosomes during metaphase I further contributes to variation.

Key differences: Mitosis produces 2 diploid cells; meiosis produces 4 haploid cells. Mitosis maintains chromosome number; meiosis halves it. Mitosis is for growth; meiosis is for reproduction.`,
  },
  {
    label: "Computer Science — Big O Notation",
    text: `Introduction to Big O Notation and Algorithm Complexity

Big O notation is a mathematical notation used in computer science to describe the upper bound of an algorithm's time or space complexity. It tells us how the runtime or memory usage grows as the input size (n) increases. Understanding Big O helps developers choose efficient algorithms and predict performance at scale.

Common time complexities from fastest to slowest:

O(1) — Constant Time: The operation takes the same time regardless of input size. Example: accessing an array element by index (arr[5]). Hash table lookups are also O(1) on average.

O(log n) — Logarithmic Time: The algorithm halves the problem space each step. Example: binary search on a sorted array. If you have 1 million elements, binary search needs at most ~20 comparisons.

O(n) — Linear Time: Runtime grows directly proportional to input size. Example: iterating through an array to find a maximum value. If input doubles, time doubles.

O(n log n) — Linearithmic Time: Common in efficient sorting algorithms. Merge sort and quicksort (average case) both achieve O(n log n). This is the theoretical lower bound for comparison-based sorting.

O(n^2) — Quadratic Time: Often seen with nested loops. Bubble sort and selection sort are O(n^2). For 10,000 elements, that is 100 million operations — noticeably slow.

O(2^n) — Exponential Time: Runtime doubles with each additional input element. Example: recursive Fibonacci without memoization, brute-force subset generation.

Space complexity follows the same notation but measures memory usage. An algorithm can be time-efficient but space-heavy (or vice versa). The trade-off between time and space is a fundamental concept in algorithm design.`,
  },
  {
    label: "History — The French Revolution",
    text: `The French Revolution (1789–1799)

The French Revolution was a period of radical political and societal transformation in France that began with the Estates-General of 1789 and ended with the formation of the French Consulate in November 1799. It profoundly influenced modern concepts of democracy, citizenship, and human rights.

Causes: France faced a severe financial crisis due to costly involvement in the American Revolution, an inequitable tax system, and extravagant spending by the monarchy. The social structure divided people into three estates: the First Estate (clergy), the Second Estate (nobility), and the Third Estate (commoners, who comprised 98% of the population but had the least political power). Enlightenment ideas about liberty, equality, and popular sovereignty fueled resentment.

Key Events: On July 14, 1789, revolutionaries stormed the Bastille, a royal fortress and prison, symbolizing the fall of royal authority. The Declaration of the Rights of Man and of the Citizen was adopted in August 1789, proclaiming individual freedoms and equality before the law. In 1792, the monarchy was abolished and King Louis XVI was executed in January 1793.

The Reign of Terror (1793–1794), led by Maximilien Robespierre and the Committee of Public Safety, saw thousands executed by guillotine in the name of protecting the revolution from internal and external enemies. Robespierre himself was eventually arrested and executed, ending the Terror.

Legacy: The Revolution established principles of popular sovereignty and civic equality that shaped modern democratic governments. It inspired subsequent revolutions worldwide and led directly to the rise of Napoleon Bonaparte, who seized power in 1799.`,
  },
];
