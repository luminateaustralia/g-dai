export type ShelterLookupRow = {
  id: string;
  normalisedName: string;
  postcode: string | null;
};

export type ShelterLookups = {
  shelterIdsByName: Map<string, string[]>;
  shelterIdsByPostcode: Map<string, string[]>;
  shelterPostcodeById: Map<string, string | null>;
};

export function buildShelterLookups(
  shelters: ShelterLookupRow[]
): ShelterLookups {
  const shelterIdsByName = new Map<string, string[]>();
  const shelterIdsByPostcode = new Map<string, string[]>();
  const shelterPostcodeById = new Map<string, string | null>();

  for (const row of shelters) {
    shelterPostcodeById.set(row.id, row.postcode);
    if (row.normalisedName) {
      const list = shelterIdsByName.get(row.normalisedName) ?? [];
      list.push(row.id);
      shelterIdsByName.set(row.normalisedName, list);
    }
    if (row.postcode) {
      const list = shelterIdsByPostcode.get(row.postcode) ?? [];
      list.push(row.id);
      shelterIdsByPostcode.set(row.postcode, list);
    }
  }

  return { shelterIdsByName, shelterIdsByPostcode, shelterPostcodeById };
}

export function resolveShelterId(
  fulfilment: { normalisedShelterName: string; postcode: string | null },
  lookups: ShelterLookups
): string | null {
  const { shelterIdsByName, shelterIdsByPostcode, shelterPostcodeById } =
    lookups;

  if (fulfilment.normalisedShelterName) {
    const nameCandidates = shelterIdsByName.get(fulfilment.normalisedShelterName);
    if (nameCandidates?.length === 1) return nameCandidates[0];
    if (nameCandidates && nameCandidates.length > 1 && fulfilment.postcode) {
      const postcodeMatches = nameCandidates.filter(
        (id) => shelterPostcodeById.get(id) === fulfilment.postcode
      );
      if (postcodeMatches.length === 1) return postcodeMatches[0];
    }
  }

  if (fulfilment.postcode) {
    const postcodeCandidates = shelterIdsByPostcode.get(fulfilment.postcode);
    if (postcodeCandidates?.length === 1) return postcodeCandidates[0];
  }

  return null;
}
