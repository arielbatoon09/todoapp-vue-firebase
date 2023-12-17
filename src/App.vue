<script setup>
import { ref, onMounted, computed } from 'vue';
import database from './firebase';
import { collection, query, onSnapshot, serverTimestamp, getDoc, addDoc, deleteDoc, updateDoc, doc, orderBy, where, getDocs } from "firebase/firestore";

const db = database;
const filter = ref('all');
const data = ref([]);
const search = ref(null);

const FormData = ref({
	task: null,
	status: null,
});

const renderTaskData = async () => {
	const queryData = query(collection(db, "todo"), orderBy("created_at", "desc"));

	onSnapshot(queryData, (querySnapshot) => {
		const tasks = [];
		querySnapshot.forEach((item) => {
			const task = {
				id: item.id,
				task: item.data().task,
				status: item.data().status,
			}
			tasks.push(task);
		});
		data.value = tasks;
	});
};

const addNewTask = async () => {
	FormData.value.status = false;

	if (!FormData.value.task) {
		return;
	}

	const response = await addDoc(collection(db, "todo"), {
		task: FormData.value.task,
		status: FormData.value.status,
		created_at: serverTimestamp()
	});

	if (response.id) {
		FormData.value.task = null;
		FormData.value.status = null;

		console.log('success');
	}
};

const markAsCompleted = async (id) => {
	const dataQuery = doc(db, 'todo', id);

	const snapshot = await getDoc(dataQuery);

	if (snapshot.exists()) {
		const currentStatus = snapshot.data().status;

		// Toggle the status
		const newStatus = !currentStatus;

		// Update the status in Firestore
		const newData = {
			status: newStatus
		};

		await updateDoc(dataQuery, newData);
		console.log("Updated student record.");

	} else {
		console.log("Record not found.");
	}
};

const clearAllCompleted = async () => {
	const todoCollection = collection(db, 'todo');

	// Query for completed items
	const completedQuery = query(todoCollection, where('status', '==', true));

	try {
		// Get the completed items
		const completedItemsSnapshot = await getDocs(completedQuery);

		// Delete each completed item
		const deletePromises = [];
		completedItemsSnapshot.forEach((doc) => {
			const deletePromise = deleteDoc(doc.ref);
			deletePromises.push(deletePromise);
		});

		// Wait for all delete operations to complete
		await Promise.all(deletePromises);

		alert('Completed items deleted.');
	} catch (error) {
		console.error('Error deleting completed items:', error);
		alert('Error deleting completed items.');
	}
};

const countPending = computed(() => {
	return data.value.filter(item => !item.status).length;
});

const setFilter = (selectedFilter) => {
	filter.value = selectedFilter;
};

const filteredData = computed(() => {
	const filteredByStatus = filterDataByStatus(data.value);
	return filterDataBySearch(filteredByStatus);
});

const filterDataByStatus = (items) => {
	if (filter.value === 'all') {
		return items;
	} else if (filter.value === 'pending') {
		return items.filter(item => !item.status);
	} else if (filter.value === 'completed') {
		return items.filter(item => item.status);
	}
};

const filterDataBySearch = (items) => {
	if (!search.value) {
		return items;
	}

	const searchLower = search.value.toLowerCase();
	return items.filter(item => item.task.toLowerCase().includes(searchLower));
};

onMounted(() => {
	renderTaskData();
});

</script>

<template>
	<main>
		<section class="cmp_banner flex flex-col gap-20 justify-center items-center">
			<h1 class="text-white text-center font-bold text-5xl">My ToDo List</h1>

			<!-- Input -->
			<div class="flex items-center">
				<input v-model="FormData.task" @keyup.enter="addNewTask"
					class="p-3 text-gray-500 rounded-tl rounded-bl outline-0" type="text"
					placeholder="Create a new todo..." />
				<button @click="addNewTask" class="flex items-center bg-red-400 p-3.5 rounded-tr rounded-br gap-2">
					<svg class="w-[20px] h-[20px] text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
						fill="none" viewBox="0 0 18 18">
						<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
							d="M9 1v16M1 9h16" />
					</svg>
				</button>
			</div>
		</section>

		<section class="flex flex-col justify-center items-center">
			<div
				class="bg-white flex flex-col justify-between shadow w-full h-screen lg:w-[500px] lg:h-[500px] rounded -mt-[30px] lg:-mt-[40px] overflow-y-auto">
				<ul>
					<!-- Search -->
					<li class="w-full sticky top-0">
						<input v-model="search" class="p-3 text-gray-500 outline-0 border w-full" type="text"
							placeholder="What are you looking for?" />
					</li>

					<!-- Task List -->
					<li v-for="list in filteredData" class="border-b border-gray-200 p-4 flex items-center gap-6"
						:key="list.id">
						<input type="checkbox" :id="'myCheckbox' + list.id" v-model="list.isSelected"
							@change="markAsCompleted(list.id)" class="hidden" aria-hidden="true">
						<label :for="'myCheckbox' + list.id" :class="list.status ? 'bg-red-400' : 'border border-gray-400'"
							class="w-6 h-6 rounded-full cursor-pointer flex items-center justify-center transition duration-300 ease-in-out">
							<!-- Checkmark SVG -->
							<svg v-if="list.status" class="w-[18px] h-[18px] text-white" aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
								<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
									stroke-width="1.5" d="M1 5.917 5.724 10.5 15 1.5" />
							</svg>
						</label>
						<p :class="list.status ? 'line-through' : ''">{{ list.task }}</p>
					</li>
				</ul>
				<div class="sticky bottom-0 border-t border-gray-200 p-4 flex justify-center md:justify-between items-center flex-wrap md:flex-nowrap gap-5 bg-gray-50">
					<p class="text-sm text-gray-500">{{ countPending }} items left</p>
					<div class="flex gap-4">
						<button @click="setFilter('all')"
							:class="filter === 'all' ? 'text-base text-red-500 font-medium' : 'text-base text-gray-500 font-normal'">All</button>
						<button @click="setFilter('pending')"
							:class="filter === 'pending' ? 'text-base text-red-500 font-medium' : 'text-base text-gray-500 font-normal'">Pending</button>
						<button @click="setFilter('completed')"
							:class="filter === 'completed' ? 'text-base text-red-500 font-medium' : 'text-base text-gray-500 font-normal'">Completed</button>
					</div>
					<button @click="clearAllCompleted" class="text-sm text-gray-500">Clear Completed</button>
				</div>
			</div>
		</section>

		<footer class="text-center mt-16 mb-8 text-gray-300 font-medium,">
			Develop by <a class="hover:underline" href="https://www.arielbatoon.com/" target="_blank">Ariel Batoon</a>
		</footer>
	</main>
</template>

<style scoped>
.cmp_banner {
	background: linear-gradient(to bottom, rgba(247, 65, 95, 0.52), rgba(255, 182, 194, 0.73)), url('./assets/main-background.jpg');
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;
	height: 300px;
}
</style>