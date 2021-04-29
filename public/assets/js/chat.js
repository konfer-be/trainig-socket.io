/**
 * Instant messagery module
 */
const Chat = window.Chat || {

    /**
     * Websocket connection instance ws|socket.io
     */
    socket: null,

    /**
     * HTML elements of client interface
     */
    HTMLElements: {
        usersDropdown: document.body.querySelector('#users-dropdown'),
        usersDropdownTrigger: document.body.querySelector('#users-dropdown-trigger'),
        usersDropdownOptions: document.body.querySelectorAll('.users-dropdown-option'),
        usernameForm: document.body.querySelector('#form-username'),
        usernameInput: document.body.querySelector('[name=username]'),
        usernameLoader: document.body.querySelector('#loader-username'),
        chatContainer: document.body.querySelector('#chat--container'),
        peopleContainer: document.body.querySelector('#people--container')
    },

    /**
     * Initialize module
     * 
     * - HTML elements binding
     * - Sockets events binding
     * 
     * @param {WS|socket.io} socket 
     * 
     * @returns {void}
     */
    init: ( socket ) => {

        Chat.socket = socket;

        Chat.bind.userDropdown();
        Chat.bind.submitForm();
        Chat.bind.submitMessage();

        Chat.socket.on('user-added', (user, users) => {
            closeModal();
            Chat.build.userDropdownOptions(Chat.socket.id, users);
            Chat.build.peopleContainer(user.socketId, users);
        });
    
        Chat.socket.on('new-user', (user, users) => {
            Chat.HTMLElements.peopleContainer.innerHTML = '';
            Chat.build.userDropdownOptions(Chat.socket.id, users);
            Chat.build.peopleContainer(Chat.socket.id, users);
        });
    
        Chat.socket.on('recept-message', ({ from, message }) => {
            let people = Chat.utils.selectPeople(from);
            people.dispatchEvent( new Event('click') );
            let chat = document.body.querySelector(`.chat[data-chat="${from}"]`);
            if (!chat) {
                chat = Chat.build.chat(from);
            }
            chat.appendChild( Chat.build.message(message) );
        });
    
        Chat.socket.on('user-rejected', (message) => {
            Chat.HTMLElements.usernameInput.value = '';
            Chat.HTMLElements.usernameInput.setAttribute('placeholder', message); 
            Chat.HTMLElements.usernameInput.classList.remove('hidden');
            Chat.HTMLElements.usernameLoader.classList.add('hidden');
        });
    },

    utils: {

        /**
         * Select a people on the left side
         * 
         * @param {string} socketId 
         * @param {string} username 
         * 
         * @returns {HTMLElement}
         */
        selectPeople: (socketId, username) => {
            const peoples = document.body.querySelectorAll('.person');
            let people = null;

            for (let i = 0 ; i < peoples.length ; i++) {
                if (peoples[i].dataset.chat === socketId) {
                    people = peoples[i];
                }
                peoples[i].classList.remove('active');
            }
            
            if (!people) {
                people = Chat.build.people( username, socketId );
                Chat.HTMLElements.peopleContainer.appendChild( people );                    
            }

            people.classList.add('active');

            return people;    
        },

        /**
         * Select a chat conversation on the right side
         * 
         * @param {string} socketId 
         * 
         * @returns {HTMLElement}
         */
        selectChat: (socketId) => {
            const chats = document.body.querySelectorAll('.chat');
            let chat = null;

            for (let i = 0 ; i < chats.length ; i++) {
                if (chats[i].dataset.chat === socketId) {
                    chat = chats[i];
                }
                chats[i].classList.remove('active-chat');
            }

            if (!chat) {
                chat = Chat.build.chat(socketId);
                Chat.HTMLElements.chatContainer.appendChild( chat );
            }

            chat.classList.add('active-chat');

            return chat;
        },

        /**
         * Set connected users counter
         * 
         * @param {number} length
         * 
         * @returns {void}
         */
        setCounter: (length) => {
            document.body.querySelector('#room--count').textContent = length;
        }
    },

    build: {

        /**
         * Create a people HTMLElement
         * 
         * @param {string} username
         * @param {string} socketId
         * 
         * @returns {HTMLElement}
         **/
        people: (username, socketId) => {
            const hour = `${new Date().getHours()}:${new Date().getMinutes()}`;

            const img = document.createElement('img');
            img.setAttribute('alt', '');
            img.setAttribute('src', 'https://www.journaldemickey.com/sites/default/files/dico/Dark-Vador-STAR-WARS.jpg');
            
            const name = document.createElement('span');
            name.classList.add('name');
            name.textContent = username;

            const time = document.createElement('span');
            time.classList.add('time');
            time.textContent = hour;

            const preview = document.createElement('span');
            preview.classList.add('preview');
            preview.textContent = 'TODO';

            people = document.createElement('li');
            people.classList.add('person');
            people.dataset.chat = socketId;
            people.dataset.username = username;
            
            people.append(img, name, time, preview);

            return people;
        },

       /**
        * Fill people container with people HTMLElement collection
        * 
        * @param {string} socketId 
        * @param {object[]} users 
        * 
        * @returns {void}
        */
        peopleContainer: (socketId, users) => {
            users.forEach(u => {
                if (socketId !== u.socketId) {
                    Chat.HTMLElements.peopleContainer.appendChild( Chat.build.people(u.username, u.socketId) );
                }
            });
            Chat.bind.people();    
            Chat.utils.setCounter(users.length);
        },

        /**
         * Create chat HTMLElement
         * 
         * @param {string} socketId
         * 
         * @returns {HTMLElement}
         **/
        chat: (socketId) => {
            const hour = `${new Date().getHours()}:${new Date().getMinutes()}`;

            const start = document.createElement('div');
            start.classList.add('conversation-start');

            const time = document.createElement('span');
            time.innerHTML = hour;

            start.appendChild(time);

            const chat = document.createElement('div');
            chat.classList.add('chat');
            chat.classList.add('active-chat');
            chat.dataset.chat = socketId;
            chat.appendChild(start);

            return chat;
        },

        /**
         * Fill users dropdown with connected users except current user himself
         * 
         * @param {string} currentUserSocketId
         * @param {object[]} users
         * 
         * @returns {void}
         **/
        userDropdownOptions: (currentUserSocketId, users) => {
            Chat.HTMLElements.usersDropdown.innerHTML = '';
            users.forEach(user => {
                if (user.socketId !== currentUserSocketId) {
                    const li = document.createElement('li');
                    li.classList.add('users-dropdown-option');
                    li.textContent = user.username;
                    li.dataset.chat = user.socketId;
                    li.dataset.username = user.username;

                    Chat.HTMLElements.usersDropdown.appendChild(li);
                }
            });
            Chat.bind.userDropdownOptions();
        },

        /**
         * Create message HTMLElement
         * 
         * @param {string} text
         * @param {boolean} isEmitter
         * 
         * @returns {HTMLElement}
         **/
        message: (text, isEmitter = false) => {
            const msg = document.createElement('div');
            msg.classList.add('bubble');
            msg.classList.add(isEmitter ? 'me' : 'you');
            msg.textContent = text;
            return msg;
        }
    },

    bind: {
        
        /**
         * Bind click event on people HTMLElement
         **/
        people: () => {
            const persons = document.body.querySelectorAll('.person');
            persons.forEach(person => {
                person.addEventListener('click', function(e) {
                    e.stopPropagation();
                    document.body.querySelectorAll('.person').forEach(p => p.classList.remove('active'));
                    this.classList.add('active');
                    document.body.querySelector('[name="send-message"]').dataset.to = this.dataset.chat;
                    Chat.utils.selectChat(this.dataset.chat);
                    document.body.querySelector('#users-dropdown-trigger').textContent = this.dataset.username;
                }, false);
            })
        },

        /**
         * Bind click event on user dropdown name HTMLElement
         **/
        userDropdown: () => {
            Chat.HTMLElements.usersDropdownTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                Chat.HTMLElements.usersDropdown.parentNode.classList.contains('hidden') ? Chat.HTMLElements.usersDropdown.parentNode.classList.remove('hidden') : Chat.HTMLElements.usersDropdown.parentNode.classList.add('hidden');
            });
        },

        /**
         * Bind click event on users dropdown options HTMLElement
         **/
        userDropdownOptions: () => {
            Chat.HTMLElements.usersDropdownOptions = document.body.querySelectorAll('.users-dropdown-option')
            Chat.HTMLElements.usersDropdownOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    Chat.utils.selectPeople(e.target.dataset.chat, e.target.dataset.username);
                    Chat.utils.selectChat(e.target.dataset.chat);
                    Chat.HTMLElements.usersDropdown.parentNode.classList.add('hidden');
                    Chat.HTMLElements.usersDropdownTrigger.innerHTML = e.target.dataset.username;                            
                });
            });
        },

        /**
         * Bind submit event on username form
         **/
        submitForm: () => {
            Chat.HTMLElements.usernameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                setTimeout(() => {
                    Chat.socket.emit('set-username', Chat.HTMLElements.usernameInput.value);
                }, 500);
                Chat.HTMLElements.usernameInput.classList.add('hidden');
                Chat.HTMLElements.usernameLoader.classList.remove('hidden');
            });
        },

        /**
         * Bind submit event on message form
         **/
        submitMessage: () => {
            const formHTMLElement = document.body.querySelector('#form-message');
            formHTMLElement.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.body.querySelector('[name="send-message"]'); 
                Chat.socket.emit('send-message', { from: Chat.socket.id, to: input.dataset.to, message: input.value });
                const message = Chat.build.message(input.value, true);
                const chat = document.body.querySelector(`.chat[data-chat="${input.dataset.to}"]`);
                chat.appendChild(message);
                input.value = '';
            });
        }
    }
};