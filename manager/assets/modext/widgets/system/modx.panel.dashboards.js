MODx.panel.Dashboards = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        id: 'modx-panel-dashboards'
        ,bodyStyle: ''
        ,defaults: { collapsible: false ,autoHeight: true }
        ,items: [{
            html: '<h2>'+_('dashboards')+'</h2>'
            ,border: false
            ,id: 'modx-dashboards-header'
            ,cls: 'modx-page-header'
        },MODx.getPageStructure([{
            layout: 'form'
            ,bodyStyle: 'padding: 15px;'
            ,title: _('dashboards')
            ,items: [{
                html: '<p>'+_('dashboards.intro_msg')+'</p>'
                ,border: false
            },{
                xtype: 'modx-grid-dashboards'
                ,preventRender: true
            }]
        },{
            layout: 'form'
            ,bodyStyle: 'padding: 15px;'
            ,title: _('widgets')
            ,items: [{
                html: '<p>'+_('widgets.intro_msg')+'</p>'
                ,border: false
            },{
                xtype: 'modx-grid-dashboard-widgets'
                ,preventRender: true
            }]
        }],{
            stateful: true
            ,stateId: 'modx-dashboards-tabpanel'
            ,stateEvents: ['tabchange']
            ,getState:function() {
                return {activeTab:this.items.indexOf(this.getActiveTab())};
            }
        })]
    });
    MODx.panel.Dashboards.superclass.constructor.call(this,config);
};
Ext.extend(MODx.panel.Dashboards,MODx.FormPanel);
Ext.reg('modx-panel-dashboards',MODx.panel.Dashboards);

MODx.grid.Dashboards = function(config) {
    config = config || {};

    this.sm = new Ext.grid.CheckboxSelectionModel();
    Ext.applyIf(config,{
        url: MODx.config.connectors_url+'system/dashboard.php'
        ,fields: ['id','name','description','cls']
        ,paging: true
        ,autosave: true
        ,remoteSort: true
        ,sm: this.sm
        ,columns: [this.sm,{
            header: _('id')
            ,dataIndex: 'id'
            ,width: 50
            ,sortable: true
        },{
            header: _('name')
            ,dataIndex: 'name'
            ,width: 150
            ,sortable: true
            ,editor: { xtype: 'textfield' ,allowBlank: false }
        },{
            header: _('description')
            ,dataIndex: 'description'
            ,width: 300
            ,sortable: false
            ,editor: { xtype: 'textarea' }
        }]
        ,tbar: [{
            text: _('dashboard_create')
            ,handler: this.createDashboard
            ,scope: this
        },'-',{
            text: _('bulk_actions')
            ,menu: [{
                text: _('selected_remove')
                ,handler: this.removeSelected
                ,scope: this
            }]
        },'->',{
            xtype: 'textfield'
            ,name: 'search'
            ,id: 'modx-dashboard-search'
            ,emptyText: _('search_ellipsis')
            ,listeners: {
                'change': {fn: this.search, scope: this}
                ,'render': {fn: function(cmp) {
                    new Ext.KeyMap(cmp.getEl(), {
                        key: Ext.EventObject.ENTER
                        ,fn: function() {
                            this.fireEvent('change',this.getValue());
                            this.blur();
                            return true;}
                        ,scope: cmp
                    });
                },scope:this}
            }
        },{
            xtype: 'button'
            ,id: 'modx-filter-clear'
            ,text: _('filter_clear')
            ,listeners: {
                'click': {fn: this.clearFilter, scope: this}
            }
        }]
    });
    MODx.grid.Dashboards.superclass.constructor.call(this,config);
};
Ext.extend(MODx.grid.Dashboards,MODx.grid.Grid,{
    getMenu: function() {
        var r = this.getSelectionModel().getSelected();
        var p = r.data.cls;

        var m = [];
        if (this.getSelectionModel().getCount() > 1) {
            m.push({
                text: _('selected_remove')
                ,handler: this.removeSelected
                ,scope: this
            });
        } else {
            if (p.indexOf('pupdate') != -1) {
                m.push({
                    text: _('dashboard_update')
                    ,handler: this.updateDashboard
                });
            }
            if (p.indexOf('premove') != -1 && r.data.id != 1 && r.data.name != 'Default') {
                if (m.length > 0) m.push('-');
                m.push({
                    text: _('dashboard_remove')
                    ,handler: this.removeDashboard
                });
            }
        }
        if (m.length > 0) {
            this.addContextMenuItem(m);
        }
    }

    ,createDashboard: function() {
        location.href = 'index.php?a='+MODx.action['system/dashboards/create'];
    }
    ,removeSelected: function() {
        var cs = this.getSelectedAsList();
        if (cs === false) return false;

        MODx.msg.confirm({
            title: _('dashboard_remove_multiple')
            ,text: _('dashboard_remove_multiple_confirm')
            ,url: this.config.url
            ,params: {
                action: 'removeMultiple'
                ,users: cs
            }
            ,listeners: {
                'success': {fn:function(r) {
                    this.getSelectionModel().clearSelections(true);
                    this.refresh();
                },scope:this}
            }
        });
        return true;
    }

    ,removeDashboard: function() {
        MODx.msg.confirm({
            title: _('dashboard_remove')
            ,text: _('dashboard_confirm_remove')
            ,url: this.config.url
            ,params: {
                action: 'remove'
                ,id: this.menu.record.id
            }
            ,listeners: {
            	'success': {fn:this.refresh,scope:this}
            }
        });
    }

    ,updateDashboard: function() {
        location.href = 'index.php?a='+MODx.action['system/dashboards/update']+'&id='+this.menu.record.id;
    }
    ,search: function(tf,newValue,oldValue) {
        var nv = newValue || tf;
        this.getStore().baseParams.query = Ext.isEmpty(nv) || Ext.isObject(nv) ? '' : nv;
        this.getBottomToolbar().changePage(1);
        this.refresh();
        return true;
    }
    ,clearFilter: function() {
    	this.getStore().baseParams = {
            action: 'getList'
    	};
        Ext.getCmp('modx-dashboard-search').reset();
    	this.getBottomToolbar().changePage(1);
        this.refresh();
    }
});
Ext.reg('modx-grid-dashboards',MODx.grid.Dashboards);