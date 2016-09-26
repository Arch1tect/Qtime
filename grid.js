// register the grid component
Vue.component('qtime-grid', {
  template: '#grid-template',
  props: {
    data: Array,
    columns: Array,
    filterKey: String

  },
  data: function () {
    var sortOrders = {}
    this.columns.forEach(function (key) {
      sortOrders[key] = 1
    })
    return {
      sortKey: '',
      sortOrders: sortOrders,
      selectedCategory: [],
      options: [
        { text: 'None', value: '' },
        { text: 'Movie', value: 'movie' },
        { text: 'Anime', value: 'anime' },
        { text: 'Show', value: 'show' }
      ],
    }
  },
  methods: {
    sortBy: function (key) {
      this.sortKey = key
      this.sortOrders[key] = this.sortOrders[key] * -1
    },
    filterByCategory: function(entry) {
      var i=0;
      for (; i<this.selectedCategory.length; i++) {

        if (entry.category === this.selectedCategory[i]||this.selectedCategory[i]==='')
          return true;
      }
      if (!i) return true;
      return false;
    }
  }
})

// bootstrap the qtime
var qtime = new Vue({
  el: '#qtime',
  data: {
    searchQuery: '',
    gridColumns: ['title', 'duration', 'category'],
    gridData: [
      { title: 'Intersteller', duration: 150, category: 'movie'},
      { title: '东京暗响', duration: 25, category: 'anime'},
      { title: 'South Park', duration: 20, category: 'show'},
      { title: '齐神', duration: 5, category: 'anime'}
    ]
  }
})


