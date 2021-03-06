/* global QUnit sinon */

jQuery.sap.require("sap.ui.qunit.qunit-coverage");

sap.ui.define([
	// internal:
	'sap/ui/fl/Utils',
	'sap/ui/core/Manifest',
	'sap/ui/rta/command/CommandFactory',
	'sap/ui/dt/ElementDesignTimeMetadata',
	'sap/ui/dt/OverlayRegistry',
	'sap/ui/dt/ElementOverlay',
	'sap/ui/fl/variants/VariantManagement',
	'sap/ui/rta/plugin/ControlVariant',
	'sap/ui/fl/variants/VariantModel',
	'sap/ui/fl/FlexControllerFactory',
	// should be last:
	'sap/ui/thirdparty/sinon',
	'sap/ui/thirdparty/sinon-ie',
	'sap/ui/thirdparty/sinon-qunit'
],
function(
	Utils,
	Manifest,
	CommandFactory,
	ElementDesignTimeMetadata,
	OverlayRegistry,
	ElementOverlay,
	VariantManagement,
	ControlVariant,
	VariantModel,
	FlexControllerFactory
) {
	'use strict';

	var oData = {
		"variantMgmtId1": {
			"defaultVariant": "variantMgmtId1",
			"variants": [
				{
					"author": "SAP",
					"key": "variantMgmtId1",
					"layer": "VENDOR",
					"readOnly": true,
					"title": "Standard"
				}
			]
		}
	};

	var oManifestObj = {
		"sap.app": {
			id: "MyComponent",
			"applicationVersion": {
				"version": "1.2.3"
			}
		}
	};
	var oManifest = new Manifest(oManifestObj);

	var oMockedAppComponent = {
		getLocalId: function () {
			return undefined;
		},
		getModel: function () {return oModel;},
		getId: function() {
			return "RTADemoAppMD";
		},
		getManifestObject: function() {
			return oManifest;
		}
	};

	sinon.stub(Utils, "getAppComponentForControl").returns(oMockedAppComponent);
	sinon.stub(Utils, "getComponentClassName").returns("Dummy.Component");

	var oFlexController = FlexControllerFactory.createForControl(oMockedAppComponent, oManifest);

	var oModel = new VariantModel(oData, oFlexController, oMockedAppComponent);

	var oVariant = {
		"content": {
			"fileName":"variant0",
			"title":"variant A",
			"layer":"CUSTOMER",
			"variantReference":"variant00",
			"support":{
				"user":"Me"
			},
			reference: "Dummy.Component"
		},
		"changes" : [
			{
				"fileName":"change44"
			},
			{
				"fileName":"change45"
			}
		]
	};

	sinon.stub(oModel, "getVariant").returns(oVariant);
	sinon.stub(oModel.oVariantController, "addVariantToVariantManagement").returns(1);

	QUnit.module("Given two controls with designtime metadata for combine ...", {
		beforeEach : function(assert) {
			this.oVariantManagement = new VariantManagement("variantMgmtId1");
		},
		afterEach : function(assert) {
			this.oVariantManagement.destroy();
		}
	});

	QUnit.test("when calling command factory for duplicate variants", function(assert) {
		var done = assert.async();

		var oOverlay = new ElementOverlay();
		sinon.stub(OverlayRegistry, "getOverlay").returns(oOverlay);
		sinon.stub(oOverlay, "getVariantManagement").returns("idMain1--variantManagementOrdersTable");

		var oDesignTimeMetadata = new ElementDesignTimeMetadata({
			data : {
				actions : {
					duplicate : {
						changeType: "duplicateControlVariant"
					}
				}
			}
		});

		var oControlVariantDuplicateCommand = CommandFactory.getCommandFor(this.oVariantManagement, "duplicate", {
			sourceVariantReference : oVariant.content.variantReference
		}, oDesignTimeMetadata);

		assert.ok(oControlVariantDuplicateCommand, "control variant duplicate command exists for element");
		oControlVariantDuplicateCommand.execute().then( function() {
			var oDuplicateVariant = oControlVariantDuplicateCommand.getDuplicateVariant();
			assert.notEqual(oDuplicateVariant.getId().indexOf("_Copy"), -1, "then fileName correctly duplicated");
			assert.equal(oDuplicateVariant.getVariantReference(), oVariant.content.variantReference, "then variant reference correctly duplicated");
			assert.equal(oDuplicateVariant.getTitle(), oVariant.content.title + " Copy", "then variant reference correctly duplicated");
			assert.equal(oDuplicateVariant.getChanges().length, 2, "then 2 changes duplicated");
			assert.equal(oDuplicateVariant.getChanges()[0].fileName, oVariant.changes[0].fileName + "_Copy", "then changes duplicated with new fileNames");
			done();
		});
	});


});
