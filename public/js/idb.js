// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

// this event iwll emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    // save a refenrece to the database
    const db = event.target.result;
    // create an object store (table) called `new_budget`, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_budget', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
    //when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save refernce to db in global variable
    db = event.target.result

    // check if app is online, if yes run uploadRecrod() funciton to send all local db data to api
    if (navigator.onLine) {
        uploadRecord();
    }
};

request.onerror = function (evet) {
    // log error here
    console.log(evet.target.errorCode);
}

// This function will be executed if we attempt to submit a new budgetlog and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_budget'], 'readwrite')

    // access the object store for `new_budget`
    const recordObjectStore = transaction.objectStore('new_budget');

    // add record to your store with add method
    recordObjectStore.add(record);
}

function uploadRecord() {
    // open a transaction on your db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access your object store
    const recordObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = recordObjectStore.getAll()

    getAll.onsuccess = function () {
        // if there was data in the indexDb's store, lets send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_budget'], 'readwrite');
                    // acccess the new_budget object store
                    const recordObjectStore = transaction.objectStore('new_budget');
                    // clear all item in your store
                    recordObjectStore.clear();

                    alert('All saved records has been submitted!');
                })
                .catch(err => {
                    console.log(err)
                });
        }
    };
}

// listen for app coming back online

window.addEventListener('online', uploadRecord)