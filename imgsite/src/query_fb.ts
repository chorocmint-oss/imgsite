import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0771953928",
  appId: "1:710790926344:web:57d9a3f6bb0ecec71e81bd",
  apiKey: "AIzaSyARGxVAClenhj_62TGEz2DRW_lDTEnsdMY",
  authDomain: "gen-lang-client-0771953928.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-b7d88296-cfcb-40c3-a805-6ecdb973f2b7");

async function main() {
  const querySnapshot = await getDocs(collection(db, "markdowns"));
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
  });
}
main().catch(console.error);
