Vue.component('modal', {
  template: '#modal-template',
  props: {
    header: String,
    cellObj: Object
  },
  computed: {
	confirmBtn: function () {
		var text = 'OK';
		if (Cookies.get('lang')==='cn') 
			text = '确定';
		return text;
	},
	cancelBtn: function () {
		var text = 'Cancel';
		if (Cookies.get('lang')==='cn') 
			text = '取消';
		return text;
	}
  }
})