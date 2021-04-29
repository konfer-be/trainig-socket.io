/* Modal */

const modalContainer = document.body.querySelector('#modal-container')

function openModal() {
    modalContainer.classList.remove('out')
    document.body.classList.add('modal-active')
}

function closeModal() {
    modalContainer.classList.add('out')
    document.body.classList.remove('modal-active')
}