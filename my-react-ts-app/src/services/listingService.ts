import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

// Type for bolig
export type Listing = {
  address: string;
  area: string;
  postalCode: string;
  city: string;
  notes: string;
  createdAt: Timestamp;
};

// Funksjon for å lagre ny bolig til Firestore
export async function saveListing(listingData: Omit<Listing, "createdAt">) {
  try {
    console.log("Prøver å lagre listing:", listingData);
    console.log("db objekt:", db);
    
    console.log("Steg 1: Henter collection...");
    const listingsCollection = collection(db, "listings");
    console.log("Steg 2: Collection hentet:", listingsCollection);
    
    console.log("Steg 3: Kaller addDoc...");
    const dataToSave = {
      ...listingData,
      createdAt: Timestamp.now(),
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
