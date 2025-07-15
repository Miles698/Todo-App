import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ColorPicker } from "primereact/colorpicker";

export default function LabelsFeaturesSection() {
  const [labels, setLabels] = useState([]);
  const [features, setFeatures] = useState([]);

  const [labelDialogVisible, setLabelDialogVisible] = useState(false);
  const [featureDialogVisible, setFeatureDialogVisible] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [labelQuery, setLabelQuery] = useState("");
  const [newFeature, setNewFeature] = useState("");

  const [labelColor, setLabelColor] = useState("#00bfff");
  const [featureColor, setFeatureColor] = useState("#00bfff");

  const addLabel = () => {
    setLabels([...labels, { text: newLabel, query: labelQuery, color: labelColor }]);
    setNewLabel("");
    setLabelQuery("");
    setLabelColor("#00bfff");
    setLabelDialogVisible(false);
  };

  const addFeature = () => {
    setFeatures([...features, { text: newFeature, color: featureColor }]);
    setNewFeature("");
    setFeatureColor("#00bfff");
    setFeatureDialogVisible(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Labels Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Labels
          <Button icon="pi pi-plus" severity="secondary"  rounded onClick={() => setLabelDialogVisible(true)} />
        </h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {labels.map((l, i) => (
            <span
              key={i}
              style={{
                backgroundColor: l.color,
                color: "#fff",
                padding: "0.4rem 0.8rem",
                borderRadius: "1rem",
              }}
            >
              {l.text} {l.query && `(${l.query})`}
            </span>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div>
        <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Features
          <Button icon="pi pi-plus" severity="secondary"  rounded onClick={() => setFeatureDialogVisible(true)} />
        </h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {features.map((f, i) => (
            <span
              key={i}
              style={{
                backgroundColor: f.color,
                color: "#fff",
                padding: "0.4rem 0.8rem",
                borderRadius: "1rem",
              }}
            >
              {f.text}
            </span>
          ))}
        </div>
      </div>

      {/* Label Dialog */}
      <Dialog
        header="Add Label"
        visible={labelDialogVisible}
        style={{ width: "400px" }}
        onHide={() => setLabelDialogVisible(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <InputText
            placeholder="Label name"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <InputText
            placeholder="Query"
            value={labelQuery}
            onChange={(e) => setLabelQuery(e.target.value)}
          />
          <ColorPicker value={labelColor} onChange={(e) => setLabelColor(e.value)} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <Button label="Cancel" onClick={() => setLabelDialogVisible(false)} />
            <Button label="Add" onClick={addLabel} disabled={!newLabel.trim()} />
          </div>
        </div>
      </Dialog>

      {/* Feature Dialog */}
      <Dialog
        header="Add Feature"
        visible={featureDialogVisible}
        style={{ width: "400px" }}
        onHide={() => setFeatureDialogVisible(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <InputText
            placeholder="Feature name"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
          />
          <ColorPicker value={featureColor} onChange={(e) => setFeatureColor(e.value)} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <Button label="Cancel" onClick={() => setFeatureDialogVisible(false)} />
            <Button label="Add" onClick={addFeature} disabled={!newFeature.trim()} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
