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
          A structured reference guide to key terms used in peptide science,
          covering foundational biology, signalling pathways, and cellular
          systems.
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
            description="Peptides that influence mitochondrial function, involved in energy production and apoptosis."
          />

          <GlossaryItem
            title="Neuropeptides"
            description="Small protein-like molecules used by neurons to communicate with each other in signalling pathways."
          />

          <GlossaryItem
            title="Oligopeptide"
            description="A peptide consisting of a small number of amino acids, typically between two and twenty."
          />

          <GlossaryItem
            title="Peptide Bond"
            description="A covalent bond formed between amino acids when the carboxyl group of one reacts with the amino group of another."
          />

          <GlossaryItem
            title="Peptide Hormones"
            description="Chains of amino acids that function as hormones, such as insulin and glucagon."
          />

          <GlossaryItem
            title="Peptidomimetics"
            description="Synthetic molecules designed to mimic the biological activity of peptides with improved stability or specificity."
          />

          <GlossaryItem
            title="Polypeptide"
            description="A long chain of amino acids. Chains over ~50 amino acids are typically considered proteins."
          />

          <GlossaryItem
            title="Receptor"
            description="Proteins that bind specific molecules (ligands), triggering a biological response."
          />

          <GlossaryItem
            title="Somatostatin"
            description="A peptide hormone that inhibits the release of several other hormones, including growth hormone."
          />

          <GlossaryItem
            title="Signal Peptide"
            description="A short peptide that directs a protein to specific locations in or outside the cell."
          />

          <GlossaryItem
            title="Synthetic Peptides"
            description="Artificially created peptides used in research to mimic or modify natural peptide function."
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
            description="The semipermeable membrane surrounding a cell, regulating movement of substances in and out."
          />

          <GlossaryItem
            title="Cytokines"
            description="Proteins involved in cell signalling, particularly within the immune system."
          />

          <GlossaryItem
            title="Endoplasmic Reticulum (ER)"
            description="A cellular structure involved in protein and lipid synthesis."
          />

          <GlossaryItem
            title="Golgi Apparatus"
            description="An organelle that modifies, sorts, and packages proteins for transport."
          />

          <GlossaryItem
            title="Ligand"
            description="A molecule that binds to a receptor and influences its function."
          />

          <GlossaryItem
            title="Mitochondria"
            description="Organelles responsible for energy production through cellular respiration."
          />

          <GlossaryItem
            title="Nucleus"
            description="The cell structure that contains genetic material (DNA)."
          />

          <GlossaryItem
            title="Ribosome"
            description="A molecular structure that synthesises proteins from messenger RNA."
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