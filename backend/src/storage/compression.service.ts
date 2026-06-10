import { Injectable } from '@nestjs/common';
import { NodeIO } from '@gltf-transform/core';
import { draco } from '@gltf-transform/functions';

@Injectable()
export class CompressionService {
  // NodeIO est l'interface gltf-transform pour lire/écrire des GLB en Node.js.
  // On l'instancie une seule fois au niveau du service (pas dans la méthode)
  // pour ne pas recréer l'objet à chaque appel.
  private io = new NodeIO();

  async compressGlb(inputBuffer: Buffer): Promise<Buffer> {
    // Lecture du GLB depuis le buffer reçu (le SOURCE_3D uploadé par l'artiste).
    const document = await this.io.readBinary(new Uint8Array(inputBuffer));

    // draco() compresse la géométrie du mesh avec l'algorithme Draco de Google.
    // Réduit typiquement la taille du fichier de 60 à 90% selon la complexité du modèle.
    // Le PREVIEW_3D résultant est destiné uniquement à l'affichage dans le viewer web,
    // pas au téléchargement — la qualité visuelle réduite est acceptable.
    await document.transform(draco());

    const compressed = await this.io.writeBinary(document);
    return Buffer.from(compressed);
  }
}