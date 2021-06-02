let db;
let budgetVersion;

const request = window.indexedDB.open('budget', budgetVersion || 10);

request.onupgradeneeded = event => {

    const { oldVersion } = event;
    const newVersion = event.newVersion || db.version;

    console.log(`updated DB from ${oldVersion} to ${newVersion}`);

    db = event.target.result;

    if (db.objectStoreNames.length < 1) {
        db.createObjectStore('budgetStore', { autoIncrement: true });
    }
}

request.onerror = error => {
    console.log(error.target.errorCode);
}

const checkDB = () => {
    let transaction = db.transaction(['budgetStore'], 'readwrite');
    const store = transaction.objectStore('budgetStore');
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch('api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
            })
            .then((res => res.json()))
            .then((data)=> {
                if (data.length != 0) {
                    transaction = db.transaction(['budgetStore'], 'readwrite');
                    const currentStore = transaction.objectStore('budgetStore');
                    currentStore.clear();
                }
            });
        }
    };
};

request.onsuccess = event => {
    db = event.target.result;

    if (navigator.onLine) {
        checkDB();
    }
};

const saveRecord = (record) => {
    const transaction = db.transaction(['budgetStore'], 'readwrite');
    const store = transaction.objectStore('budgetStore');
    store.add(record);
}

window.addEventListener('online', checkDB);