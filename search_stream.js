/**
 * class to search stream from Twitch API
 */
class SearchStream {
    /**
     * [constructor() - accepts apiUrl and query as properties from instantiation]
     * @param  {[string]} apiUrl [accepts the API url]
     * @param  {[string]} query  [query string that will be passed from search input field]
     * @return {[this]}        [return urls, total pages and page counter with implicit this]
     */
    constructor(apiUrl, query) {
        this.apiUrl = apiUrl;
        this.query = query;
        this._url = apiUrl + query;
        this._prevUrl = '';
        this._nextUrl = '';
        this._totalPages = 0;
        this._pageCounter = 1;
    }
    /**
     * [getJSONP() - generate the JSONP callback to make cross domain API request]
     * @param  {Function} callback [a callback function that will be handled when generate JSONP request to server]
     * @return {[function]}            [a call back function]
     */
    getJSONP(callback) {
        // attaching random number along with the JSONP callback name for security
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        window[callbackName] = function(data) {
            // deleting existing JSONP callback
            delete window[callbackName];
            document.body.removeChild(script);
            return callback(data);
        };
        const script = document.createElement('script');
        // registered client_id is used to be compatible with Twitch API conventions
        script.src = this._url + (this._url.indexOf('?') >= 0 ? '&' : '?') + '&client_id=2wqd84jzctpguefwja1mlf660g5e7a&callback=' + callbackName;
        document.body.appendChild(script);
    }
    /**
     * [renderList() - dynamically creating and rendering the DOM list based on API result set]
     * @param  {[object]} data [data that will be returned from JSONP API server call]
     * @return {[object]}      [rendered DOM]
     */
    renderList(data) {
        const streamList = document.getElementById('streamList');
        // cleanup the existing list for new search result
        if (streamList.childElementCount > 0) {
            streamList.innerHTML = "";
        }
        // render the total result count, result for and pagination
        this.renderSummary(data);

        const streamData = data.streams;

        streamData.forEach((stream) => {
            const item = document.createElement('li');
            const article = document.createElement('article');
            const img = document.createElement('img');
            const imgContainer = document.createElement('div');
            const txtContainer = document.createElement('div');
            const title = document.createElement('h2');
            const p1 = document.createElement('p');
            const p2 = document.createElement('p');

            img.src = stream.preview.medium || "";
            title.innerHTML = stream.channel.display_name || "No display name";
            p1.innerHTML = stream.game + ' - ' + stream.viewers + ' viewers';
            p2.innerHTML = stream.channel.status;

            imgContainer.append(img);

            txtContainer.append(title);
            txtContainer.append(p1);
            txtContainer.append(p2);

            article.append(imgContainer);
            article.append(txtContainer);

            item.append(article);
            streamList.appendChild(item);
        });
    }
    /**
     * [renderSummary() - render total search result count, search for query name, and pagination with count]
     * @param  {[object]} data [data that will be returned from JSONP API server call]
     * @return {[object]}      [rendered DOM]
     */
    renderSummary(data) {
        const streamTotal = document.querySelector('.total-count');
        const searchFor = document.querySelector('.search-for');
        const streamPaging = document.querySelector('.pagination');

        this._totalPages = Math.floor(data._total / 10);
        this._nextUrl = data._links && data._links.next || '';
        this._prevUrl = data._links && data._links.prev || '';

        streamTotal.innerHTML = 'Total result: ' + data._total;
        searchFor.innerHTML = 'Search result for: ' + this.query;

        if (this._totalPages) {
            streamPaging.innerHTML = `  <a href="javascript:void(0)" class="pager prev">prev</a>
                                            <span class="page-counter">${this._pageCounter}</span>
                                            <span>/ ${this._totalPages}</span>
                                        <a href="javascript:void(0)" class="pager next">next</a>`;
        } else {
            streamPaging.innerHTML = "";
        }
    }
    /**
     * [init() - initial rendering result and initializing DOM events such as search, pagination clicks]
     * @return {[this]} [rendered DOM list and events]
     */
    init() {
        this.getJSONP((data) => this.renderList(data));
        this.initDOMEvents();
    }
    /**
     * [handleSearch() - get the search input value from user and render the new result set from JSONP server call]
     * @param  {[event]} e [event object]
     * @return {[type]}   [rended DOM with new result set]
     */
    handleSearch(e) {
        const searchStreamInput = document.querySelector('#searchStreamInput');
        this.query = searchStreamInput.value;
        if (this.query === "") {
            return;
        }
        this._url = this.apiUrl + this.query;
        this.getJSONP((data) => this.renderList(data));
    }
    /**
     * [handlePagination() - event handler for pagination clicks]
     * @param  {[event]} e [event object]
     * @return {[type]}   [rendering the new page result based on next or prev button clicks]
     */
    handlePagination(e) {
        if (e.target.classList.contains('next')) {
            if (this._pageCounter >= 1 && this._pageCounter < this._totalPages) {
                this._url = this._nextUrl;
                this.getJSONP((data) => {
                    this._pageCounter++;
                    this.renderList(data)
                });
            }
        } else if (e.target.classList.contains('prev')) {
            if (this._pageCounter > 1) {
                this._url = this._prevUrl;
                this.getJSONP((data) => {
                    this._pageCounter--;
                    this.renderList(data)
                });
            }
        } else {
            return;
        }
    }
    /**
     * [initDOMEvents() -  initialize the DOM events]
     * @return {[type]} [events]
     */
    initDOMEvents() {
        const paginationContainer = document.querySelector('.pagination');
        const searchStreamBtn = document.querySelector('#searchStreamBtn');

        paginationContainer.addEventListener('click', e => this.handlePagination(e));
        searchStreamBtn.addEventListener('click', e => this.handleSearch(e));
    }
}
// creating a instance of SearchStream class and passing Twitch API url as apiUrl and starcraft as default query
const searchStreamObj = new SearchStream('https://api.twitch.tv/kraken/search/streams?limit=10&q=', 'starcraft');
// render the initial result list and initialize the dom events
searchStreamObj.init();