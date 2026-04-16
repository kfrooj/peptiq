export default function PeptideGlossaryPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">
          Reference information only, not medical advice.
        </p>
      </div>

      <section className="mb-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Peptides Glossary
        </h1>

        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
          Welcome to our comprehensive glossary of peptide-related terms. This guide is designed to help you understand the fundamental concepts and key terms in peptide science, from amino acids to cellular contexts.
        </p>

        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
          Peptides, comprising amino acids linked by peptide bonds, are a fundamental category of biological molecules with pivotal roles in cellular processes and scientific research applications. Understanding the dichotomy between agonists and antagonists and their interaction with cellular receptors is essential for comprehending the mechanistic basis of peptide function in biological systems.
        </p>
      </section>

      {/* SECTION: Peptide Science */}
      <section className="mb-5 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Key Terms in Peptide Science
        </h2>

        <div className="mt-4 grid gap-4">
          <GlossaryItem
            title="Amino Acids"
            description="The building blocks of proteins and peptides, consisting of a central carbon atom, an amino group, a carboxyl group, and a distinctive side chain."
          />

          <GlossaryItem
            title="Bioactive Peptides"
            description="Peptides studied for their interactions with biological systems in laboratory research, including antimicrobial and immunological signalling studies."
          />

          <GlossaryItem
            title="Enzymes"
            description="Proteins that catalyse biochemical reactions in living organisms, often playing critical roles in metabolism and signalling pathways."
          />

          <GlossaryItem
            title="GHRP (Growth Hormone-Releasing Peptides)"
            description="Synthetic peptides studied for their interaction with growth hormone signalling pathways."
          />

          <GlossaryItem
            title="Mitochondrial Peptides"
            description="Peptides that are encoded by mitochondrial DNA or influence mitochondrial function, involved in energy production and apoptosis."
          />

          <GlossaryItem
            title="Neuropeptides"
            description="Small protein-like molecules used by neurons to communicate with each other, involved in many physiological signalling pathways studied in neuroscience research."
          />

          <GlossaryItem
            title="Oligopeptide"
            description="A peptide consisting of a small number of amino acids, typically between two and twenty."
          />

          <GlossaryItem
            title="Peptide Bond"
            description="A covalent chemical bond formed between two amino acid molecules when the carboxyl group of one molecule reacts with the amino group of the other molecule, releasing a molecule of water (H2O)."
          />

          <GlossaryItem
            title="Peptide Hormones"
            description="Chains of amino acids that function as hormones in the body, such as insulin and glucagon, which are involved in metabolic signalling pathways."
          />

          <GlossaryItem
            title="Peptidomimetics"
            description="Small protein-like chains designed to mimic the biological activity of a natural peptide but with enhanced stability, bioavailability, or specificity."
          />

          <GlossaryItem
            title="Polypeptide"
            description="A long, continuous chain of amino acids. Polypeptides with more than 50 amino acids are typically considered proteins."
          />

          <GlossaryItem
            title="Receptor"
            description="Proteins that bind specific molecules (ligands), triggering a biological response."
          />

          <GlossaryItem
            title="Somatostatin"
            description="A peptide hormone that inhibits the release of several other hormones, including growth hormone and insulin, playing a critical role in the endocrine system."
          />

          <GlossaryItem
            title="Signal Peptide"
            description="A short peptide present at the N-terminus of a protein that directs the protein to specific destinations within or outside the cell."
          />

          <GlossaryItem
            title="Synthetic Peptides"
            description="Peptides that are artificially made using peptide synthesis techniques, often designed to mimic or modify the function of natural peptides for research purposes."
          />
        </div>
      </section>

      {/* SECTION: Cellular */}
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Cellular & Molecular Terms
        </h2>

        <div className="mt-4 grid gap-4">
          <GlossaryItem
            title="Cell Membrane"
            description="The semipermeable membrane surrounding the cytoplasm of a cell, which regulates the passage of substances in and out of the cell."
          />

          <GlossaryItem
            title="Cytokines"
            description="Small proteins released by cells that have a specific effect on the interactions and communications between cells, often involved in immune responses."
          />

          <GlossaryItem
            title="Endoplasmic Reticulum (ER)"
            description="A network of membranous tubules within the cytoplasm of a cell, involved in protein and lipid synthesis."
          />

          <GlossaryItem
            title="Golgi Apparatus"
            description="An organelle in cells that modifies, sorts, and packages proteins for secretion or delivery to other organelles."
          />

          <GlossaryItem
            title="Ligand"
            description="A molecule that binds to a specific site on a protein, such as a receptor, influencing the function of the protein."
          />

          <GlossaryItem
            title="Mitochondria"
            description="Organelles found in large numbers in most cells, involved in the production of energy through aerobic respiration."
          />

          <GlossaryItem
            title="Nucleus"
            description="TA membrane-bound organelle within eukaryotic cells that contains the genetic material (DNA)."
          />

          <GlossaryItem
            title="Ribosome"
            description="A complex molecular machine found within all living cells that performs the synthesis of proteins according to the sequence of messenger RNA (mRNA)."
          />
        </div>
      </section>
    </main>
  );
}

function GlossaryItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-4">
      <p className="text-sm font-semibold text-[var(--color-text)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        {description}
      </p>
    </div>
  );
}