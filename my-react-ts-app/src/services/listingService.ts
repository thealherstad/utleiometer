import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

// Type for bolig
export type Listing = {
  id: string;
  address: string;
  postalCode: string;
  poststed: string;
  city: string;
  price: number;
  notes: string;
  imageUrl?: string;
  createdAt: Timestamp;
};

export class DuplicateListingError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.name = "DuplicateListingError";
    this.code = "DUPLICATE_LISTING";
  }
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

async function hasDuplicateListing(address: string, postalCode: string): Promise<boolean> {
  const normalizedAddress = normalizeValue(address);
  const normalizedPostalCode = normalizeValue(postalCode);

  const querySnapshot = await getDocs(collection(db, "listings"));

  return querySnapshot.docs.some((docSnapshot) => {
    const data = docSnapshot.data();
    const existingAddress = normalizeValue(data.address || "");
    const existingPostalCode = normalizeValue(data.postalCode || "");

    return (
      existingAddress === normalizedAddress &&
      existingPostalCode === normalizedPostalCode
    );
  });
}

// Funksjon for å lagre ny bolig til Firestore
export async function saveListing(listingData: Omit<Listing, "id" | "createdAt">) {
  try {
    console.log("Prøver å lagre listing:", listingData);
    console.log("db objekt:", db);
    
    console.log("Steg 1: Henter collection...");
    const listingsCollection = collection(db, "listings");
    console.log("Steg 2: Collection hentet:", listingsCollection);
    
    const isDuplicate = await hasDuplicateListing(listingData.address, listingData.postalCode);
    if (isDuplicate) {
      throw new DuplicateListingError("Boligen er allerede registrert.");
    }

    console.log("Steg 3: Kaller addDoc...");
    const dataToSave = {
      ...listingData,
      createdAt: Timestamp.now(),
      imageUrl: listingData.imageUrl || "",
    };
    console.log("Steg 4: Data som skal lagres:", dataToSave);
    
    const docRef = await addDoc(listingsCollection, dataToSave);
    console.log("✅ Steg 5: Bolig lagret med ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ FEIL ved lagring:", error);
    console.error("Feil detaljer:", {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      full: error
    });
    throw error;
  }
}

// Funksjon for å hente alle boligene fra Firestore
export async function getAllListings(): Promise<Listing[]> {
  try {
    console.log("📥 Henter alle boligene fra Firestore...");
    const querySnapshot = await getDocs(collection(db, "listings"));
    
    const listings: Listing[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      listings.push({
        id: doc.id,
        address: data.address || "",
        area: data.area || "",
        postalCode: data.postalCode || "",
        city: data.city || "",
        notes: data.notes || "",
        imageUrl: data.imageUrl || "",
        price: data.price ?? 0,
        createdAt: data.createdAt || Timestamp.now(),
      });
    });
    
    console.log("✅ Hentet", listings.length, "boligene");
    return listings;
  } catch (error) {
    console.error("❌ Feil ved henting av boligene:", error);
    throw error;
  }
}
