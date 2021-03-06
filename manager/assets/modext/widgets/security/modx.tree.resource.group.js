/**
 * Generates the Resource Group Tree in Ext
 * 
 * @class MODx.tree.ResourceGroup
 * @extends MODx.tree.Tree
 * @param {Object} config An object of options.
 * @xtype modx-tree-resourcegroup
 */
MODx.tree.ResourceGroup = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        title: _('resource_groups')
        ,url: MODx.config.connectors_url+'security/resourcegroup.php'
        ,root_id: '0'
        ,root_name: _('resource_groups')
        ,enableDrag: false
        ,enableDrop: true
        ,ddAppendOnly: true
        ,useDefaultToolbar: true
        ,tbar: [{
            text: _('resource_group_create')
            ,scope: this
            ,handler: this.createResourceGroup
        }]
    });
    MODx.tree.ResourceGroup.superclass.constructor.call(this,config);
};
Ext.extend(MODx.tree.ResourceGroup,MODx.tree.Tree,{
    forms: {}
    ,windows: {}
    ,stores: {}

    ,getMenu: function() {
        var n = this.cm.activeNode;
        var m = [];
        if (n.attributes.type == 'modResourceGroup') {
            m.push({
                text: _('resource_group_create')
                ,handler: this.createResourceGroup
            });
            m.push('-');
            m.push({
                text: _('resource_group_update')
                ,handler: this.updateResourceGroup
            });
            m.push('-');
            m.push({
                text: _('resource_group_remove')
                ,handler: this.removeResourceGroup
            });
        } else if (n.attributes.type == 'modResource') {
            m.push({
                text: _('resource_group_access_remove')
                ,handler: this.removeResource
            });
        }
        return m;
    }

    ,updateResourceGroup: function(itm,e) {
        var r = this.cm.activeNode.attributes.data;

        if (!this.windows.updateResourceGroup) {
            this.windows.updateResourceGroup = MODx.load({
                xtype: 'modx-window-resourcegroup-update'
                ,record: r
                ,listeners: {
                    'success': {fn:this.refresh,scope:this}
                }
            });
        }
        this.windows.updateResourceGroup.reset();
        this.windows.updateResourceGroup.setValues(r);
        this.windows.updateResourceGroup.show(e.target);

    }

    ,removeResource: function(item,e) {
        var n = this.cm.activeNode;
        var resourceId = n.id.split('_'); resourceId = resourceId[1];
        var resourceGroupId = n.parentNode.id.substr(2).split('_'); resourceGroupId = resourceGroupId[1];

        MODx.msg.confirm({
            text: _('resource_group_access_remove_confirm')
            ,url: this.config.url
            ,params: {
                action: 'removeResource'
                ,resource: resourceId
                ,resourceGroup: resourceGroupId
            }
            ,listeners: {
                'success': {fn:this.refresh,scope:this}
            }
        });
    }

    ,removeResourceGroup: function(item,e) {
        var n = this.cm.activeNode;
        var id = n.id.substr(2).split('_'); id = id[1];

        MODx.msg.confirm({
            text: _('resource_group_remove_confirm')
            ,url: this.config.url
            ,params: {
                action: 'remove'
                ,id: id
            }
            ,listeners: {
                'success': {fn:this.refresh,scope:this}
            }
        });
    }
	
    ,createResourceGroup: function(itm,e) {
        if (!this.windows.create) {
            this.windows.create = MODx.load({
                xtype: 'modx-window-resourcegroup-create'
                ,listeners: {
                    'success': {fn:this.refresh,scope:this}
                }
            });
        }
        this.windows.create.show(e.target);
    }
	
    ,_handleDrop: function(e){
        var n = e.dropNode;

        if(this.isDocCopy(e,n)) {
            var copy = new Ext.tree.TreeNode(
                Ext.apply({leaf: true,allowDelete:true,expanded:true}, n.attributes)
            );
            copy.loader = undefined;
            if(e.target.attributes.options){
                e.target = this.createDGD(e.target, copy.text);
            }
            e.dropNode = copy;
            return true;
        }
        return false;
    }
	
    ,isDocCopy: function(e, n) {
        var a = e.target.attributes;
        var docid = n.attributes.id.split('_'); docid = 'n_'+docid[1];

        if (e.target.findChild('id',docid) !== null) { return false; }
        if (n.attributes.type != 'modResource') { return false; }
        if (e.point != 'append') { return false; }
        if (a.type != 'modResourceGroup') { return false; }
        if (a.leaf === true) { return false; }
        return true;
    }
	
    ,createDGD: function(n, text){
        var cnode = this.getNodeById(n.attributes.cmpId);

        var node = new Ext.tree.TreeNode({
            text: text
            ,cmpId:cnode.id
            ,leaf: true
            ,allowDelete:true
            ,allowEdit:true
            ,id:this._guid('o-')
        });
        cnode.childNodes[2].appendChild(node);
        cnode.childNodes[2].expand(false, false);

        return node;
    }
    
    ,_handleDrag: function(dropEvent) {
        Ext.Msg.show({
            title: _('please_wait')
            ,msg: _('saving')
            ,width: 240
            ,progress:true
            ,closable:false
        });

        MODx.util.Progress.reset();
        for(var i = 1; i < 20; i++) {
            setTimeout('MODx.util.Progress.time('+i+','+MODx.util.Progress.id+')',i*1000);
        }

        MODx.Ajax.request({
            url: this.config.url
            ,scope: this
            ,params: {
                resource: dropEvent.dropNode.attributes.id
                ,resourceGroup: dropEvent.target.attributes.id
                ,action: 'updateResourcesIn'
            }
            ,listeners: {
                'success': {fn: function(r,o) {
                    MODx.util.Progress.reset();
                    Ext.Msg.hide();
                    if (!r.success) {
                        Ext.Msg.alert(_('error'),r.message);
                        return false;
                    }
                    this.refresh();
                    return true;
                },scope:this}
            }
        });
    }
});
Ext.reg('modx-tree-resource-group',MODx.tree.ResourceGroup);


MODx.window.CreateResourceGroup = function(config) {
    config = config || {};
    this.ident = config.ident || 'crgrp'+Ext.id();
    Ext.applyIf(config,{
        title: _('resource_group_create')
        ,id: this.ident
        ,height: 150
        ,width: 350
        ,url: MODx.config.connectors_url+'security/resourcegroup.php'
        ,action: 'create'
        ,fields: [{
            fieldLabel: _('name')
            ,name: 'name'
            ,id: 'modx-'+this.ident+'-name'
            ,xtype: 'textfield'
            ,anchor: '90%'
        }]
    });
    MODx.window.CreateResourceGroup.superclass.constructor.call(this,config);
};
Ext.extend(MODx.window.CreateResourceGroup,MODx.Window);
Ext.reg('modx-window-resourcegroup-create',MODx.window.CreateResourceGroup);

MODx.window.UpdateResourceGroup = function(config) {
    config = config || {};
    this.ident = config.ident || 'urgrp'+Ext.id();
    Ext.applyIf(config,{
        title: _('resource_group_update')
        ,id: this.ident
        ,height: 150
        ,width: 350
        ,url: MODx.config.connectors_url+'security/resourcegroup.php'
        ,action: 'update'
        ,fields: [{
            name: 'id'
            ,xtype: 'hidden'
            ,id: 'modx-'+this.ident+'-id'
        },{
            fieldLabel: _('name')
            ,name: 'name'
            ,id: 'modx-'+this.ident+'-name'
            ,xtype: 'textfield'
            ,anchor: '90%'
        }]
    });
    MODx.window.UpdateResourceGroup.superclass.constructor.call(this,config);
};
Ext.extend(MODx.window.UpdateResourceGroup,MODx.Window);
Ext.reg('modx-window-resourcegroup-update',MODx.window.UpdateResourceGroup);