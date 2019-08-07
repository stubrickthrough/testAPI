var Table = function(ops){
    this.dataList = [];
    this.table = {};
    this.tid = ops.id;
}
Table.prototype = {
    getRowItemById: function (id) {
        var _item = null;
        var list = this.dataList
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            item.id == id ? _item = item : ''
            break;
        }
        return _item;
    },
    deleteRowItem: function (id) {
        var list = this.dataList;
        for (var i = list.length - 1; i >= 0; i--) {
            if (list[i].id == id) {
                list.splice(i, 1);
            }
        }
        this.reloadTable();
    },
    updateRowItem: function (item,key,callback) {
        var id = item[key]; //item:ajax获取的json； key:用于自定义标示数据行的flag，唯一；
        var idkey = this.idkey;
        var tid = this.tid;
        var arr = this.dataList;
 
        for(var ii =0;ii<arr.length;ii++){
            var _arr = arr[ii];
            var index = ii;
            if(_arr[idkey] == id){
                arr[index] = item;
                var $div = $("#"+tid).next()
                var $tr = $div.find('.layui-table-body table.layui-table').find('tr').eq(index);
                var $tds = $tr.find('td');
                for(var i =0;i<$tds.length;i++){
                    var $td = $tds.eq(i);
                    var $field = $td.attr('data-field');
                    var $itemValue = item[$field];
                    var $tdValue = $td.find('div').html();
                    if($itemValue!=$tdValue){
                        $td.find('div').html($itemValue);
                    }
                }
                continue;
            }
        }
        if (callback) {
            callback(item)
        }
    },
    dbClickTableItem: function (callback) {
    },
    addRowItem: function (item) {
        var list = this.dataList;
        list.unshift(item);
        this.reloadTable();
    },
    reloadTable: function (callback) {
        var list = this.dataList;
        this.table.reload(this.tid, {
            data: list
        });
    },
    clearTable: function () {
        this.dataList = [];
        this.reloadTable();
    },
    rederTable: function (ops, callback) {
        this.table.render(ops);
 
        typeof callback == 'function' ? callback() : '';
    },
    initialize: function (callback) {
        var _ = this;
        layui.use('table', function () {
            var table = layui.table;
            _.table = table;
            typeof callback == 'function' ? callback(_.table) : '';
        })
    },
    bindRowDBclick: function (el, callback) {
        var _this = this;
        var $d = $('body');
        $d.on('dblclick', "tbody tr", function (e) {
            var target = e;
            var $index = $(this).index();
            var $tr = $(el).next().find("tbody tr")[$index];
            if (this == $tr) {
                var list = _this.dataList;
                var rowData = list[$index];
                callback(target, list, rowData)
            } else {
                console.error('Illegal operation without registration\n' +
                    '\n')
            }
        })
 
    }
 
}